"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
require("mocha");
var errors_1 = __importDefault(require("../../src/sdk-wrapper/errors"));
describe('SDK: Errors', function () {
    it('should create a valid error object', function () {
        var errorMessage = 'test message';
        var errorName = 'test error name';
        var stack = 'test stack';
        var error = new errors_1.default(errorMessage, errorName, stack);
        chai_1.expect(error.message).to.equal("otSDK: " + errorMessage);
        chai_1.expect(error.name).to.equal(errorName);
        chai_1.expect(error.stack).to.equal(stack);
    });
});
//# sourceMappingURL=errors.spec.js.map