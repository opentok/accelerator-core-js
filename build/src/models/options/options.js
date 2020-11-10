"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
var Options = /** @class */ (function () {
    function Options(credentials, controlsContainer, packages, streamContainers, largeScale, applicationName, annotation, archiving, communication, textChat, screenSharing) {
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
    return Options;
}());
exports.Options = Options;
//# sourceMappingURL=options.js.map