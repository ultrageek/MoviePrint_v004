/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import {
  SHEET_TYPE,
  VIEW,
} from '../utils/constants';
import styles from './ThumbGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height, thumbId }) =>
  (
    <Popup
      trigger={
        <button
          type='button'
          data-tid={`thumbDragHandleBtn_${thumbId}`}
          className={`${styles.dragHandleButton}`}
          style={{
            width,
            height: Math.floor(height),
          }}
        >
          <img
            src={transparent}
            style={{
              width,
              height: Math.floor(height),
            }}
            alt=""
          />
        </button>
      }
      mouseEnterDelay={2000}
      on={['hover']}
      pinned
      offset='-50%r, -50%r'
      position='top right'
      basic
      className={stylesPop.popupSmall}
      content="Drag thumb"
    />
  ));

const AllFaces = ({facesArray, thumbWidth, thumbHeight}) =>
  (
    facesArray.map((face, index) => (
      <FaceRect
        key={index}
        face={face}
        thumbWidth={thumbWidth}
        thumbHeight={thumbHeight}
      />
    ))
  );

const FaceRect = ({face, thumbWidth, thumbHeight}) =>
  (
    <React.Fragment>
      <div
        className={styles.faceRect}
        style={{
          width: `${face.box.width * thumbWidth}px`,
          height: `${face.box.height * thumbHeight}px`,
          left: `${face.box.x * thumbWidth}px`,
          top: `${face.box.y * thumbHeight}px`,
        }}
      />
      <div
        className={styles.faceRectTag}
        style={{
          left: `${face.box.x * thumbWidth}px`,
          top: `${face.box.y * thumbHeight}px`,
        }}
      >
        {face.faceId}
      </div>
    </React.Fragment>
  );

const Thumb = ({
  aspectRatioInv,
  base64,
  facesArray,
  borderRadius,
  color,
  controllersAreVisible,
  dim,
  frameninfoBackgroundColor,
  frameinfoColor,
  frameinfoPosition,
  frameinfoScale,
  hidden,
  index,
  indexForId,
  inputRefThumb,
  keyObject,
  margin,
  frameinfoMargin,
  onOver,
  onSelect,
  onThumbDoubleClick,
  selected,
  sheetType,
  thumbCSSTranslate,
  thumbId,
  thumbImageObjectUrl,
  thumbInfoRatio,
  thumbInfoValue,
  thumbWidth,
  transparentThumb,
  view,
}) => {

  function onThumbDoubleClickWithStop(e) {
    e.stopPropagation();
    if (controllersAreVisible) {
      if (view === VIEW.PLAYERVIEW) {
        onSelect();
      } else {
        onThumbDoubleClick();
      }
    }
  }

  function onSelectWithStop(e) {
    e.stopPropagation();
    if (controllersAreVisible) {
      onSelect();
    }
  }

  function onOverWithStop(e) {
    // e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    if (onOver) {
      onOver(e);
    }
  }

  function onOutWithStop(e) {
    e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    // if (onOut) {
    //   onOut(e);
    // }
  }

  const thumbHeight = thumbWidth * aspectRatioInv;

  return (
    <div
      ref={inputRefThumb}
      role="button"
      tabIndex={index}
      onMouseEnter={onOverWithStop}
      onMouseLeave={onOutWithStop}
      onFocus={onOverWithStop}
      onBlur={onOutWithStop}
      onClick={onSelectWithStop}
      onKeyPress={onSelectWithStop}
      onDoubleClick={onThumbDoubleClickWithStop}
      id={`thumb${indexForId}`}
      className={`${styles.gridItem} ${(view === VIEW.PLAYERVIEW && selected && !(keyObject.altKey || keyObject.shiftKey)) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbHeight)}px`}
      style={{
        // width: thumbWidth,
        margin,
        outlineWidth: margin,
        borderRadius: `${(selected && view === VIEW.PLAYERVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: transparentThumb ||
          (thumbImageObjectUrl === undefined)  ||
          (thumbImageObjectUrl === 'blob:file:///fakeURL')? color : undefined,
      }}
    >
      <img
        data-tid={`thumbImg_${thumbId}`}
        src={transparentThumb ? transparent : thumbImageObjectUrl === undefined ? `data:image/jpeg;base64, ${base64}` : thumbImageObjectUrl}
        id={`thumbImage${indexForId}`}
        className={`${styles.image} ${dim ? styles.dim : ''}`}
        alt=""
        width={`${thumbWidth}px`}
        height={`${(thumbHeight)}px`}
        style={{
          filter: `${controllersAreVisible ? 'brightness(80%)' : ''}`,
          opacity: hidden ? '0.2' : '1',
          borderRadius: `${(selected && view === VIEW.PLAYERVIEW) ? 0 : borderRadius}px`,
        }}
      />
      {facesArray !== undefined &&
        <AllFaces
          facesArray={facesArray}
          thumbWidth={thumbWidth}
          thumbHeight={thumbHeight}
      />
      }
      {thumbInfoValue !== undefined &&
        <div
          data-tid={`thumbInfoText_${thumbId}`}
          className={`${styles.frameinfo} ${styles[frameinfoPosition]}`}
          style={{
            margin: frameinfoMargin,
            transform: thumbCSSTranslate,
            backgroundColor: frameninfoBackgroundColor,
            color: frameinfoColor,
          }}
        >
          {thumbInfoValue}
        </div>
      }
      <div
        style={{
          display: controllersAreVisible ? 'block' : 'none'
        }}
      >
        {sheetType === SHEET_TYPE.INTERVAL &&
          <DragHandle
            width={thumbWidth - 1} // shrink it to prevent rounding issues
            height={(thumbHeight) - 1}
            thumbId={thumbId}
          />
        }
      </div>
    </div>
  );
};

Thumb.defaultProps = {
  controllersAreVisible: false,
  dim: undefined,
  hidden: false,
  index: undefined,
  indexForId: undefined,
  keyObject: {},
  onBack: null,
  onForward: null,
  onHoverAddThumbBefore: null,
  onHoverAddThumbAfter: null,
  onHoverInPoint: null,
  onHoverOutPoint: null,
  onScrub: null,
  onAddBefore: null,
  onAddAfter: null,
  onInPoint: null,
  onLeaveInOut: null,
  onOut: null,
  onOutPoint: null,
  onOver: null,
  onSelect: null,
  onExit: null,
  onToggle: null,
  selected: false,
  thumbImageObjectUrl: undefined,
  thumbInfoValue: undefined,
};

Thumb.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  controllersAreVisible: PropTypes.bool,
  dim: PropTypes.object,
  hidden: PropTypes.bool,
  inputRefThumb: PropTypes.object,
  keyObject: PropTypes.object,
  margin: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onForward: PropTypes.func,
  onHoverAddThumbBefore: PropTypes.func,
  onHoverAddThumbAfter: PropTypes.func,
  onHoverInPoint: PropTypes.func,
  onHoverOutPoint: PropTypes.func,
  onScrub: PropTypes.func,
  onAddBefore: PropTypes.func,
  onAddAfter: PropTypes.func,
  onInPoint: PropTypes.func,
  onLeaveInOut: PropTypes.func,
  onOut: PropTypes.func,
  onOutPoint: PropTypes.func,
  onOver: PropTypes.func,
  onSelect: PropTypes.func,
  onExit: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggle: PropTypes.func,
  selected: PropTypes.bool,
  sheetType: PropTypes.string.isRequired,
  index: PropTypes.number,
  indexForId: PropTypes.number,
  thumbImageObjectUrl: PropTypes.string,
  thumbInfoRatio: PropTypes.number.isRequired,
  thumbInfoValue: PropTypes.string,
  thumbWidth: PropTypes.number.isRequired,
};

export default Thumb;
