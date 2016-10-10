'use strict';

var events = {
  core: ['connected', 'streamCreated', 'streamDestroyed', 'startScreenShare', 'endScreenShare', 'error'],
  communication: ['startCall', 'endCall', 'callPropertyChanged', 'subscribeToCamera', 'subscribeToScreen', 'unsubscribeFromCamera', 'unsubscribeFromScreen', 'startViewingSharedScreen', 'endViewingSharedScreen'],
  textChat: ['showTextChat', 'hideTextChat', 'messageSent', 'errorSendingMessage', 'messageReceived'],
  screenSharing: ['startScreenSharing', 'endScreenSharing', 'screenSharingError'],
  annotation: ['startAnnotation', 'linkAnnotation', 'resizeCanvas', 'annotationWindowClosed', 'endAnnotation'],
  archiving: ['startArchive', 'stopArchive', 'archiveReady', 'archiveError']
};

module.exports = events;