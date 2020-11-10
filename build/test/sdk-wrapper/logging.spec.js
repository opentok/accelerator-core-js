"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var sinon_1 = __importDefault(require("sinon"));
require("mocha");
var logging_1 = __importDefault(require("../../src/sdk-wrapper/logging"));
describe('SDK: Logging', function () {
    it('should log message to console', function () {
        var loggedMessage = '';
        sinon_1.default.stub(console, 'log').callsFake(function (message) {
            loggedMessage = message;
        });
        logging_1.default('test message');
        chai_1.expect(loggedMessage).to.equal("otSDK: test message");
    });
});
//# sourceMappingURL=logging.spec.js.map