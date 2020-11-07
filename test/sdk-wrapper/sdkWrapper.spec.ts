import { expect } from 'chai';
import 'mocha';

import OpenTokSDK from '../../src/sdk-wrapper/sdkWrapper';

describe('SDK: Wrapper', () => {
  it('should throw an error with invalid credentials', () => {
    expect(() => {
      new OpenTokSDK({
        apiKey: undefined,
        sessionId: undefined,
        token: undefined
      });
    }).to.throw();
  });
});
