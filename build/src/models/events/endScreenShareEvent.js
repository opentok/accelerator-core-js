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
exports.EndScreenShareEvent = void 0;
var pubSubDetail_1 = require("../pubSubDetail");
var EndScreenShareEvent = /** @class */ (function (_super) {
    __extends(EndScreenShareEvent, _super);
    function EndScreenShareEvent(pubSubDetail) {
        return _super.call(this, pubSubDetail.publishers, pubSubDetail.subscribers) || this;
    }
    return EndScreenShareEvent;
}(pubSubDetail_1.PubSubDetail));
exports.EndScreenShareEvent = EndScreenShareEvent;
//# sourceMappingURL=endScreenShareEvent.js.map