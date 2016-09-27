const events = {
  core: [
    'connected',
    'streamCreated',
    'streamDestroyed',
    'error',
  ],
  communication: [
    'startCall',
    'endCall',
    'callPropertyChanged',
    'subscribeToCamera',
    'subscribeToScreen',
    'startViewingSharedScreen',
    'endViewingSharedScreen',
  ],
  textChat: [
    'showTextChat',
    'hideTextChat',
    'messageSent',
    'errorSendingMessage',
    'messageReceived',
  ],
  screenSharing: [
    'startScreenSharing',
    'endScreenSharing',
    'screenSharingError',
  ],
  annotation: [
    'startAnnotation',
    'linkAnnotation',
    'resizeCanvas',
    'annotationWindowClosed',
    'endAnnotation',
  ],
  archiving: [
    'startArchive',
    'stopArchive',
    'archiveReady',
    'archiveError',
  ],
};


module.export = events;
