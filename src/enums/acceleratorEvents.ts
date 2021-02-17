export enum CoreEvents {
  Connected = 'connected',
  Error = 'error',
  StartScreenShare = 'startScreenShare',
  EndScreenShare = 'endScreenShare'
}

export enum CommunicationEvents {
  StartCall = 'startCall',
  EndCall = 'endCall',
  CallPropertyChanged = 'callPropertyChanged',
  SubscribeToCamera = 'subscribeToCamera',
  SubscribeToScreen = 'subscribeToScreen',
  SubscribeToSIP = 'subscribeToSip',
  UnsubscribeFromCamera = 'unsubscribeFromCamera',
  UnsubscribeFromSIP = 'unsubscribeFromSip',
  UnsubscribeFromScreen = 'unsubscribeFromScreen',
  StartViewingSharedScreen = 'startViewingSharedScreen',
  EndViewingSharedScreen = 'endViewingSharedScreen'
}

export enum SessionEvents {
  ArchiveStarted = 'archiveStarted',
  ArchiveStopped = 'archiveStopped',
  ConnectionCreated = 'connectionCreated',
  ConnectionDestroyed = 'connectionDestroyed',
  SessionConnected = 'sessionConnected',
  SessionDisconnected = 'sessionDisconnected',
  SessionReconnected = 'sessionReconnected',
  SessionReconnecting = 'sessionReconnecting',
  Signal = 'signal',
  StreamCreated = 'streamCreated',
  StreamDestroyed = 'streamDestroyed',
  StreamPropertyChanged = 'streamPropertyChanged'
}

// export enum ScreenSharingEvents {
//   StartScreensharing = 'startScreenSharing',
//   EndScreenSharing = 'endScreenSharing',
//   ScreenSharingError = 'screenSharingError'
// }

// export enum AnnotationEvents {
//   StartAnnotation = 'startAnnotation',
//   LinkAnnotation = 'linkAnnotation',
//   ResizeCanvas = 'resizeCanvas',
//   AnnotationWindowClosed = 'annotationWindowClosed',
//   EndAnnotation = 'endAnnotation'
// }

// export enum ArchivingEvents {
//   StartArchive = 'startArchive',
//   StopArchive = 'stopArchive',
//   ArchiveError = 'archiveError'
// }
