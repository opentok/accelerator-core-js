"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartScreenShareEvent = void 0;
var pubSubDetail_1 = require("../pubSubDetail");
var StartScreenShareEvent = /** @class */ (function (_super) {
    __extends(StartScreenShareEvent, _super);
    function StartScreenShareEvent(publisher, pubSubDetail) {
        var _this = _super.call(this, pubSubDetail.publishers, pubSubDetail.subscribers) || this;
        _this.publisher = publisher;
        return _this;
    }
    return StartScreenShareEvent;
}(pubSubDetail_1.PubSubDetail));
exports.StartScreenShareEvent = StartScreenShareEvent;
//# sourceMappingURL=startScreenShareEvent.js.map