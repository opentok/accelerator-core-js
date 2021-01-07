/**
 * All the events in the Accelerators
 */
export const acceleratorEvents = {
  session: [
    'archiveStarted',
    'archiveStopped',
    'connectionCreated',
    'connectionDestroyed',
    'sessionConnected',
    'sessionDisconnected',
    'sessionReconnected',
    'sessionReconnecting',
    'signal',
    'streamCreated',
    'streamDestroyed',
    'streamPropertyChanged'
  ],
  core: ['connected', 'startScreenShare', 'endScreenShare', 'error'],
  communication: [
    'startCall',
    'endCall',
    'callPropertyChanged',
    'subscribeToCamera',
    'subscribeToScreen',
    'subscribeToSip',
    'unsubscribeFromCamera',
    'unsubscribeFromSip',
    'unsubscribeFromScreen',
    'startViewingSharedScreen',
    'endViewingSharedScreen'
  ],
  textChat: [
    'showTextChat',
    'hideTextChat',
    'messageSent',
    'errorSendingMessage',
    'messageReceived'
  ],
  screenSharing: [
    'startScreenSharing',
    'endScreenSharing',
    'screenSharingError'
  ],
  annotation: [
    'startAnnotation',
    'linkAnnotation',
    'resizeCanvas',
    'annotationWindowClosed',
    'endAnnotation'
  ],
  archiving: ['startArchive', 'stopArchive', 'archiveReady', 'archiveError']
};

/**
 * Default UI properties
 * https://tokbox.com/developer/guides/customize-ui/js/
 */
export const defaultCallProperties: OT.PublisherProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off'
  }
};
