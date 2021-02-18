export declare enum CoreEvents {
    Connected = "connected",
    Error = "error",
    StartScreenShare = "startScreenShare",
    EndScreenShare = "endScreenShare"
}
export declare enum CommunicationEvents {
    StartCall = "startCall",
    EndCall = "endCall",
    CallPropertyChanged = "callPropertyChanged",
    SubscribeToCamera = "subscribeToCamera",
    SubscribeToScreen = "subscribeToScreen",
    SubscribeToSIP = "subscribeToSip",
    UnsubscribeFromCamera = "unsubscribeFromCamera",
    UnsubscribeFromSIP = "unsubscribeFromSip",
    UnsubscribeFromScreen = "unsubscribeFromScreen",
    StartViewingSharedScreen = "startViewingSharedScreen",
    EndViewingSharedScreen = "endViewingSharedScreen"
}
export declare enum SessionEvents {
    ArchiveStarted = "archiveStarted",
    ArchiveStopped = "archiveStopped",
    ConnectionCreated = "connectionCreated",
    ConnectionDestroyed = "connectionDestroyed",
    SessionConnected = "sessionConnected",
    SessionDisconnected = "sessionDisconnected",
    SessionReconnected = "sessionReconnected",
    SessionReconnecting = "sessionReconnecting",
    Signal = "signal",
    StreamCreated = "streamCreated",
    StreamDestroyed = "streamDestroyed",
    StreamPropertyChanged = "streamPropertyChanged"
}
