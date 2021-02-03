"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
var opentok_solutions_logging_1 = __importDefault(require("opentok-solutions-logging"));
var Analytics = /** @class */ (function () {
    /**
     * @param source Source of the logging event
     * @param sessionId Unique identifier of the session the event occurred in
     * @param connectionId Unique identifier of the connection on which the event occurred
     * @param apikey OpenTok API Key
     * @param applicationName Name of the application in which the event occurred
     */
    function Analytics(source, sessionId, connectionId, apikey, applicationName) {
        var otkanalyticsData = {
            clientVersion: 'js-vsol-x.y.z',
            source: source,
            componentId: 'acceleratorCore',
            name: applicationName || 'coreAccelerator',
            partnerId: apikey
        };
        this.analytics = new opentok_solutions_logging_1.default(otkanalyticsData);
        if (connectionId) {
            this.update(sessionId, connectionId, apikey);
        }
    }
    /**
     * Updates the session info of the OT Analytics Logging library
     * @param sessionId Unique identifier of the session the event occurred in
     * @param connectionId Unique identifier of the connection on which the event occurred
     * @param apikey OpenTok API Key
     */
    Analytics.prototype.update = function (sessionId, connectionId, apiKey) {
        if (sessionId && connectionId && apiKey) {
            var sessionInfo = {
                sessionId: sessionId,
                connectionId: connectionId,
                partnerId: apiKey
            };
            this.analytics.addSessionInfo(sessionInfo);
        }
    };
    /**
     * Logs an event in the OT Analytics Logging library
     * @param action The event that occurred
     * @param variation
     */
    Analytics.prototype.log = function (action, variation) {
        this.analytics.logEvent({ action: action, variation: variation });
    };
    return Analytics;
}());
exports.Analytics = Analytics;
//# sourceMappingURL=analytics.js.map