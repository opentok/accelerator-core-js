import { expect } from 'chai';
import 'mocha';

import SDKError from '../../src/sdk-wrapper/errors';

describe('SDK: Errors', () => {
  it('should create a valid error object', () => {
    const errorMessage = 'test message';
    const errorName = 'test error name';
    const stack = 'test stack';

    const error = new SDKError(errorMessage, errorName, stack);
    expect(error.message).to.equal(`otSDK: ${errorMessage}`);
    expect(error.name).to.equal(errorName);
    expect(error.stack).to.equal(stack);
  });
});
