"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var chai_1 = require("chai");
var sinon = __importStar(require("sinon"));
var sdkWrapper_1 = __importDefault(require("../../src/sdk-wrapper/sdkWrapper"));
var common_1 = require("../common");
describe('SDK: Wrapper', function () {
    before(function () {
        global.OT = common_1.fakeOT();
    });
    afterEach(function () {
        sinon.restore();
    });
    it('should throw an error with invalid credentials', function () {
        chai_1.expect(function () {
            new sdkWrapper_1.default({
                apiKey: undefined,
                sessionId: undefined,
                token: undefined
            });
        }).to.throw();
    });
    it('should set session when initialized', function (done) {
        var sdk = new sdkWrapper_1.default(common_1.fakeCredentials);
        var isMe = sdk.isMe(common_1.fakeConnection);
        chai_1.expect(isMe).to.eq(true);
        done();
    });
    it('should recognize connections that are not the current user', function (done) {
        var sdk = new sdkWrapper_1.default(common_1.fakeCredentials);
        var isMe = sdk.isMe(common_1.notFakeConnection);
        chai_1.expect(isMe).to.eq(false);
        done();
    });
});
//# sourceMappingURL=sdkWrapper.spec.js.map