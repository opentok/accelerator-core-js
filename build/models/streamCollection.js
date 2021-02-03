"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamCollection = void 0;
var streamCollectionSummary_1 = require("./streamCollectionSummary");
var StreamCollection = /** @class */ (function () {
    function StreamCollection() {
        this.camera = {};
        this.custom = {};
        this.screen = {};
        this.sip = {};
    }
    /**
     * Returns the number of camera, screen and total streams
     */
    StreamCollection.prototype.getCount = function () {
        return new streamCollectionSummary_1.StreamCollectionSummary(Object.keys(this.camera).length, Object.keys(this.custom).length, Object.keys(this.screen).length, Object.keys(this.sip).length);
    };
    /**
     * Adds the stream
     * @param type Type of stream
     * @param provider Subscriber or Publisher
     */
    StreamCollection.prototype.addStream = function (type, provider) {
        var _a;
        this[type][provider.id || ((_a = provider.stream) === null || _a === void 0 ? void 0 : _a.streamId)] = provider;
    };
    /**
     * Adds the stream
     * @param type Type of stream
     * @param provider Subscriber or Publisher
     */
    StreamCollection.prototype.removeStream = function (type, provider) {
        var _a;
        delete this[type][provider.id || ((_a = provider.stream) === null || _a === void 0 ? void 0 : _a.streamId)];
    };
    StreamCollection.prototype.getStream = function (id) {
        return (this.camera[id] || this.screen[id] || this.custom[id] || this.sip[id]);
    };
    /**
     * Clears all streams from state
     */
    StreamCollection.prototype.reset = function () {
        this.camera = {};
        this.custom = {};
        this.screen = {};
        this.sip = {};
    };
    return StreamCollection;
}());
exports.StreamCollection = StreamCollection;
//# sourceMappingURL=streamCollection.js.map