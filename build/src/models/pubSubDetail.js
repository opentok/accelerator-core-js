"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubSubDetail = void 0;
var pubSubSummary_1 = require("./pubSubSummary");
var PubSubDetail = /** @class */ (function () {
    function PubSubDetail(publishers, subscribers) {
        this.publishers = publishers;
        this.subscribers = subscribers;
        this.meta = new pubSubSummary_1.PubSubSummary(this.publishers, this.subscribers);
    }
    return PubSubDetail;
}());
exports.PubSubDetail = PubSubDetail;
//# sourceMappingURL=pubSubDetail.js.map