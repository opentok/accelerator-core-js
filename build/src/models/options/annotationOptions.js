"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentOptions = exports.AnnotationOptions = void 0;
var AnnotationOptions = /** @class */ (function () {
    function AnnotationOptions(items, colors, onScreenCapture, absoluteParent) {
        this.items = items;
        this.colors = colors;
        this.onScreenCapture = onScreenCapture;
        this.absoluteParent = absoluteParent;
    }
    return AnnotationOptions;
}());
exports.AnnotationOptions = AnnotationOptions;
var ParentOptions = /** @class */ (function () {
    function ParentOptions(publisher, subscriber) {
        this.publisher = publisher;
        this.subscriber = subscriber;
    }
    return ParentOptions;
}());
exports.ParentOptions = ParentOptions;
//# sourceMappingURL=annotationOptions.js.map