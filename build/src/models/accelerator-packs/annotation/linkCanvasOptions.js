"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkCanvasOptions = void 0;
var LinkCanvasOptions = /** @class */ (function () {
    /**
     * @param absoluteParent Reference to element(or query selector) for resize if other than container
     * @param canvasContainer The id of the parent for the annotation canvas
     * @param externalWindow Reference to the annotation window(or query selector) if publishing
     * @param mobileInitiator Is cobrowsing being initiated by a mobile device
     */
    function LinkCanvasOptions(absoluteParent, canvasContainer, externalWindow, mobileInitiator) {
        this.absoluteParent = absoluteParent;
        this.canvasContainer = canvasContainer;
        this.externalWindow = externalWindow;
        this.mobileInitiator = mobileInitiator;
    }
    return LinkCanvasOptions;
}());
exports.LinkCanvasOptions = LinkCanvasOptions;
//# sourceMappingURL=linkCanvasOptions.js.map