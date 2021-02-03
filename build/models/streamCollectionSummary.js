"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamType = exports.StreamCollectionSummary = void 0;
var StreamCollectionSummary = /** @class */ (function () {
    function StreamCollectionSummary(camera, screen, custom, sip) {
        this.camera = camera;
        this.screen = screen;
        this.custom = custom;
        this.sip = sip;
    }
    StreamCollectionSummary.prototype.total = function () {
        return this.camera + this.screen + this.sip;
    };
    return StreamCollectionSummary;
}());
exports.StreamCollectionSummary = StreamCollectionSummary;
var StreamType;
(function (StreamType) {
    StreamType["Camera"] = "camera";
    StreamType["Custom"] = "custom";
    StreamType["Screen"] = "screen";
    StreamType["SIP"] = "sip";
})(StreamType = exports.StreamType || (exports.StreamType = {}));
//# sourceMappingURL=streamCollectionSummary.js.map