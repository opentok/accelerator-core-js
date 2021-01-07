"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOptions = void 0;
var CoreOptions = /** @class */ (function () {
    function CoreOptions(credentials, controlsContainer, packages, streamContainers, largeScale, applicationName, annotation, archiving, communication, textChat, screenSharing) {
        if (largeScale === void 0) { largeScale = false; }
        this.credentials = credentials;
        this.controlsContainer = controlsContainer;
        this.packages = packages;
        this.streamContainers = streamContainers;
        this.largeScale = largeScale;
        this.applicationName = applicationName;
        this.annotation = annotation;
        this.archiving = archiving;
        this.communication = communication;
        this.textChat = textChat;
        this.screenSharing = screenSharing;
    }
    return CoreOptions;
}());
exports.CoreOptions = CoreOptions;
//# sourceMappingURL=coreOptions.js.map