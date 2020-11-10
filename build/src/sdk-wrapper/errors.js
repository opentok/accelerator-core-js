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
/**
 * Defines errors emitted from the SDK
 */
var SDKError = /** @class */ (function (_super) {
    __extends(SDKError, _super);
    function SDKError(errorMessage, errorName, stack) {
        var _this = _super.call(this, "otSDK: " + errorMessage) || this;
        _this.name = errorName;
        _this.stack = stack;
        return _this;
    }
    return SDKError;
}(Error));
exports.default = SDKError;
//# sourceMappingURL=errors.js.map