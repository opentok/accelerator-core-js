"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubSubSummary = void 0;
var PubSubSummary = /** @class */ (function () {
    function PubSubSummary(publishers, subscribers) {
        this.publisher = publishers.getCount();
        this.subscriber = subscribers.getCount();
    }
    return PubSubSummary;
}());
exports.PubSubSummary = PubSubSummary;
//# sourceMappingURL=pubSubSummary.js.map