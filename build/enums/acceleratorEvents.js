"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionEvents = exports.CommunicationEvents = exports.CoreEvents = void 0;
var CoreEvents;
(function (CoreEvents) {
    CoreEvents["Connected"] = "connected";
    CoreEvents["Error"] = "error";
    CoreEvents["StartScreenShare"] = "startScreenShare";
    CoreEvents["EndScreenShare"] = "endScreenShare";
})(CoreEvents = exports.CoreEvents || (exports.CoreEvents = {}));
var CommunicationEvents;
(function (CommunicationEvents) {
    CommunicationEvents["StartCall"] = "startCall";
    CommunicationEvents["EndCall"] = "endCall";
    CommunicationEvents["CallPropertyChanged"] = "callPropertyChanged";
    CommunicationEvents["SubscribeToCamera"] = "subscribeToCamera";
    CommunicationEvents["SubscribeToScreen"] = "subscribeToScreen";
    CommunicationEvents["SubscribeToSIP"] = "subscribeToSip";
    CommunicationEvents["UnsubscribeFromCamera"] = "unsubscribeFromCamera";
    CommunicationEvents["UnsubscribeFromSIP"] = "unsubscribeFromSip";
    CommunicationEvents["UnsubscribeFromScreen"] = "unsubscribeFromScreen";
    CommunicationEvents["StartViewingSharedScreen"] = "startViewingSharedScreen";
    CommunicationEvents["EndViewingSharedScreen"] = "endViewingSharedScreen";
})(CommunicationEvents = exports.CommunicationEvents || (exports.CommunicationEvents = {}));
var SessionEvents;
(function (SessionEvents) {
    SessionEvents["ArchiveStarted"] = "archiveStarted";
    SessionEvents["ArchiveStopped"] = "archiveStopped";
    SessionEvents["ConnectionCreated"] = "connectionCreated";
    SessionEvents["ConnectionDestroyed"] = "connectionDestroyed";
    SessionEvents["SessionConnected"] = "sessionConnected";
    SessionEvents["SessionDisconnected"] = "sessionDisconnected";
    SessionEvents["SessionReconnected"] = "sessionReconnected";
    SessionEvents["SessionReconnecting"] = "sessionReconnecting";
    SessionEvents["Signal"] = "signal";
    SessionEvents["StreamCreated"] = "streamCreated";
    SessionEvents["StreamDestroyed"] = "streamDestroyed";
    SessionEvents["StreamPropertyChanged"] = "streamPropertyChanged";
})(SessionEvents = exports.SessionEvents || (exports.SessionEvents = {}));
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
//# sourceMappingURL=acceleratorEvents.js.map