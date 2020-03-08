import path from 'path';
import * as faceapi from 'face-api.js';
import log from 'electron-log';
import * as tf from '@tensorflow/tfjs-node';

import VideoCaptureProperties from './videoCaptureProperties';
import { getArrayOfOccurrences, roundNumber, setPosition, getCropWidthAndHeight } from './utils';
import { FACE_CONFIDENCE_THRESHOLD, FACE_SIZE_THRESHOLD, FACE_UNIQUENESS_THRESHOLD } from './constants';

const opencv = require('opencv4nodejs');
const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const appPath = app.getAppPath();
const weightsPath = path.join(appPath, './dist/weights');

// to cancel file scan
let fileScanRunning = false;

const loadNet = async () => {
  const toastId = 'loadNet';
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'info',
    'Initialising face detection',
    false,
    toastId,
  );
  log.debug(weightsPath);
  log.debug(faceapi.nets);
  const detectionNet = faceapi.nets.ssdMobilenetv1;
  log.debug(detectionNet);
  await detectionNet.loadFromDisk(weightsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(weightsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'success',
    'Face detection successfully initialised',
    3000,
    toastId,
    true,
  );
  return detectionNet;
};

loadNet()
  .then(detectionNet => {
    log.debug(detectionNet);
    return undefined;
  })
  .catch(error => {
    log.error(`There has been a problem with your loadNet operation: ${error.message}`);
    ipcRenderer.send(
      'message-from-opencvWorkerWindow-to-mainWindow',
      'progressMessage',
      'error',
      `There has been a problem with your loadNet operation: ${error.message}`,
      false,
      'loadNet',
      true,
    );
  });

export const detectFace = async (
  image,
  frameNumber,
  detectionArray,
  uniqueFaceArray,
  defaultFaceConfidenceThreshold = FACE_CONFIDENCE_THRESHOLD,
  defaultFaceSizeThreshold = FACE_SIZE_THRESHOLD,
  defaultFaceUniquenessThreshold = FACE_UNIQUENESS_THRESHOLD,
) => {
  // detect expression
  const face = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceDescriptor();

  console.log(frameNumber);
  // check if a face was detected
  if (face !== undefined) {
    const { age, gender, descriptor, detection } = face;
    const { box, relativeBox, score } = detection;
    const size = Math.round(relativeBox.height * 100);
    const scoreInPercent = Math.round(score * 100);

    // console.log(face);
    if (size < defaultFaceSizeThreshold || scoreInPercent < defaultFaceConfidenceThreshold) {
      console.log('detected face below size or confidence threshold!');
      return undefined;
    }

    // create full copy of array to be pushed later
    const copyOfDescriptor = descriptor.slice();

    console.log(detection);
    console.log(uniqueFaceArray);
    console.log(copyOfDescriptor);

    // check for uniqueness
    // if the uniqueFaceArray is empty just push the current descriptor
    // else compare the current descriptor to the ones in the uniqueFaceArray

    // initialise the faceId
    let faceId = 0;
    const uniqueFaceArrayLength = uniqueFaceArray.length;
    if (uniqueFaceArrayLength === 0) {
      uniqueFaceArray.push(copyOfDescriptor);
    } else {
      // compare descriptor value with all values in the array
      for (let i = 0; i < uniqueFaceArrayLength; i += 1) {
        const dist = faceapi.euclideanDistance(copyOfDescriptor, uniqueFaceArray[i]);
        console.log(`${faceId}, ${frameNumber}`);
        console.log(dist);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < defaultFaceUniquenessThreshold) {
          // console.log(`face matches face ${i}`);
          faceId = i;
          break;
        } else if (i === uniqueFaceArrayLength - 1) {
          console.log('face is unique');
          uniqueFaceArray.push(copyOfDescriptor);
          faceId = uniqueFaceArrayLength;
        }
      }
    }

    // console.log(`frameNumber: ${frameNumber}, Score: ${score}, Size: ${size}, Gender: ${gender}, Age: ${age}`);
    // detectionArray.push({
    //   faceId,
    //   frameNumber,
    //   score: scoreInPercent,
    //   largestSize: size,
    //   gender,
    //   age: Math.round(age),
    // });
    const simpleBox = {
      x: roundNumber(relativeBox.x, 4),
      y: roundNumber(relativeBox.y, 4),
      width: roundNumber(relativeBox.width, 4),
      height: roundNumber(relativeBox.height, 4),
    };

    const facesArray = [
      {
        faceId,
        score: scoreInPercent,
        size,
        box: simpleBox,
        gender,
        age: Math.round(age),
      },
    ];
    detectionArray.push({
      frameNumber,
      faceCount: 1,
      largestSize: facesArray[0].size,
      facesArray,
    });
    return detection;
  }
  console.log('no face detected!');
  return undefined;
};

export const detectAllFaces = async (
  image,
  frameNumber,
  detectionArray,
  uniqueFaceArray,
  defaultFaceConfidenceThreshold = FACE_SIZE_THRESHOLD,
  defaultFaceSizeThreshold = FACE_CONFIDENCE_THRESHOLD,
  defaultFaceUniquenessThreshold = FACE_UNIQUENESS_THRESHOLD,
) => {
  // detect expression
  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceDescriptors();
  console.log(frameNumber);

  const faceCount = detections.length;

  if (faceCount === 0) {
    console.log('no face detected!');
    return undefined;
  }
  console.log(`Face count: ${faceCount}`);

  console.log(detections);

  const facesArray = [];
  detections.forEach(face => {
    const { age, gender, descriptor, detection } = face;
    const { box, relativeBox, score } = detection;
    const size = Math.round(relativeBox.height * 100);
    const scoreInPercent = Math.round(score * 100);

    // create full copy of array to be pushed later
    const copyOfDescriptor = descriptor.slice();

    // console.log(detection);
    // console.log(uniqueFaceArray);
    // console.log(copyOfDescriptor);

    // console.log(face);
    if (size < defaultFaceSizeThreshold || scoreInPercent < defaultFaceConfidenceThreshold) {
      console.log('detected face below size or confidence threshold!');
      return undefined;
    }

    // check for uniqueness
    // if the uniqueFaceArray is empty just push the current descriptor
    // else compare the current descriptor to the ones in the uniqueFaceArray

    // initialise the faceId
    let faceId = 0;
    const uniqueFaceArrayLength = uniqueFaceArray.length;
    if (uniqueFaceArrayLength === 0) {
      uniqueFaceArray.push(copyOfDescriptor);
    } else {
      // compare descriptor value with all values in the array
      for (let i = 0; i < uniqueFaceArrayLength; i += 1) {
        const dist = faceapi.euclideanDistance(copyOfDescriptor, uniqueFaceArray[i]);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < defaultFaceUniquenessThreshold) {
          console.log(
            dist === 0
              ? `this and face ${i} are identical: ${dist}`
              : `this and face ${i} are probably the same: ${dist}`,
          );
          faceId = i;
          break;
        } else if (i === uniqueFaceArrayLength - 1) {
          console.log(`this face is unique: ${dist}`);
          uniqueFaceArray.push(copyOfDescriptor);
          faceId = uniqueFaceArrayLength;
        }
      }
    }

    const simpleBox = {
      x: roundNumber(relativeBox.x, 4),
      y: roundNumber(relativeBox.y, 4),
      width: roundNumber(relativeBox.width, 4),
      height: roundNumber(relativeBox.height, 4),
    };

    facesArray.push({
      faceId,
      score: scoreInPercent,
      size,
      box: simpleBox,
      gender,
      age: Math.round(age),
    });

    // const drawBox = new faceapi.draw.DrawBox(box, {
    //   // label: Math.round(age),
    //   label: faceId,
    //   lineWidth: 1,
    //   boxColor: 'red'
    // })
    // drawBox.draw(image);
  });

  if (facesArray.length === 0) {
    // no faces below thresholds
    return undefined;
  }

  // sort faces by size with the largest one first
  facesArray.sort((face1, face2) => face2.size - face1.size);
  console.log(facesArray);

  detectionArray.push({
    frameNumber,
    faceCount,
    largestSize: facesArray[0].size,
    facesArray,
  });
  return detections;
};
