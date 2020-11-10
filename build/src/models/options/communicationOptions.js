"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationOptions = void 0;
var CommunicationOptions = /** @class */ (function () {
    function CommunicationOptions(autoSubscribe, callProperties, connectionLimit, screenProperties, subscribeOnly) {
        if (autoSubscribe === void 0) { autoSubscribe = true; }
        if (connectionLimit === void 0) { connectionLimit = null; }
        if (subscribeOnly === void 0) { subscribeOnly = false; }
        this.autoSubscribe = autoSubscribe;
        this.callProperties = callProperties;
        this.connectionLimit = connectionLimit;
        this.screenProperties = screenProperties;
        this.subscribeOnly = subscribeOnly;
    }
    return CommunicationOptions;
}());
exports.CommunicationOptions = CommunicationOptions;
// export class PackageCommunicationOptions extends CommunicationOptions {
//   constructor(
//     public connectionLimit: number,
//     public callProperties: any,
//     public screenProperties: any,
//     public session: OT.Session,
//     public core: any,
//     public accPack: any,
//     public controlsContainer: any,
//     public appendControl: any,
//     public state: State,
//     public analytics: any,
//     public autoSubscribe?: boolean,
//     public subscribeOnly?: boolean,
//   ) {
//     super(connectionLimit, callProperties, screenProperties, autoSubscribe, subscribeOnly);
//   }
// }
//# sourceMappingURL=communicationOptions.js.map