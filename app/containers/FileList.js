// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FileListElement from '../components/FileListElement';
import {
  updateObjectUrlsFromPosterFrame, addDefaultThumbs, setCurrentFileId,
  updateObjectUrlsFromThumbList,
} from '../actions';

class SortedFileList extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    store.dispatch(updateObjectUrlsFromPosterFrame());
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { store } = this.context;
    const state = store.getState();

    return (
      <ul>
        {state.undoGroup.present.files.map((file, index) => (
          <FileListElement
            key={file.id}
            {...file}
            index
            onClick={() => {
              store.dispatch(setCurrentFileId(file.id));
              if (state.undoGroup.present
                .thumbsByFileId[file.id] === undefined) {
                store.dispatch(addDefaultThumbs(
                    file,
                    state.undoGroup.present.settings.defaultThumbCount
                  ));
                console.log(`FileListElement clicked: ${file.name}`);
              }
              if (state.thumbsObjUrls[file.id] === undefined && state.undoGroup.present
                .thumbsByFileId[file.id] !== undefined) {
                store.dispatch(updateObjectUrlsFromThumbList(
                    file.id,
                    Object.values(state.undoGroup.present
                      .thumbsByFileId[file.id]
                      .thumbs).map((a) => a.frameId)
                  ));
                console.log(`FileListElement clicked: ${file.name}`);
              }
            }}
            currentFileId={state.undoGroup.present.settings.currentFileId}
          />
        ))}
      </ul>
    );
  }
}

SortedFileList.contextTypes = {
  store: PropTypes.object
};

export default SortedFileList;
