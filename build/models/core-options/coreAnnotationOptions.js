"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentOptions = exports.CoreAnnotationOptions = void 0;
var CoreAnnotationOptions = /** @class */ (function () {
    function CoreAnnotationOptions(items, colors, onScreenCapture, absoluteParent) {
        this.items = items;
        this.colors = colors;
        this.onScreenCapture = onScreenCapture;
        this.absoluteParent = absoluteParent;
    }
    return CoreAnnotationOptions;
}());
exports.CoreAnnotationOptions = CoreAnnotationOptions;
var ParentOptions = /** @class */ (function () {
    function ParentOptions(publisher, subscriber) {
        this.publisher = publisher;
        this.subscriber = subscriber;
    }
    return ParentOptions;
}());
exports.ParentOptions = ParentOptions;
//# sourceMappingURL=coreAnnotationOptions.js.map