"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreCommunicationOptions = void 0;
var CoreCommunicationOptions = /** @class */ (function () {
    function CoreCommunicationOptions(autoSubscribe, callProperties, connectionLimit, screenProperties, subscribeOnly) {
        if (autoSubscribe === void 0) { autoSubscribe = true; }
        if (connectionLimit === void 0) { connectionLimit = null; }
        if (subscribeOnly === void 0) { subscribeOnly = false; }
        this.autoSubscribe = autoSubscribe;
        this.callProperties = callProperties;
        this.connectionLimit = connectionLimit;
        this.screenProperties = screenProperties;
        this.subscribeOnly = subscribeOnly;
    }
    return CoreCommunicationOptions;
}());
exports.CoreCommunicationOptions = CoreCommunicationOptions;
//# sourceMappingURL=coreCommunicationOptions.js.map