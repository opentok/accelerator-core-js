import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import OpenTokSDK from '../../src/sdk-wrapper/sdkWrapper';
import {
  fakeConnection,
  fakeCredentials,
  fakeOT,
  notFakeConnection
} from '../common';

describe('SDK: Wrapper', function () {
  before(function () {
    global.OT = fakeOT();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw an error with invalid credentials', () => {
    expect(() => {
      new OpenTokSDK({
        apiKey: undefined,
        sessionId: undefined,
        token: undefined
      });
    }).to.throw();
  });

  it('should set session when initialized', (done) => {
    const sdk = new OpenTokSDK(fakeCredentials);
    const isMe = sdk.isMe(fakeConnection);
    expect(isMe).to.eq(true);
    done();
  });

  it('should recognize connections that are not the current user', (done) => {
    const sdk = new OpenTokSDK(fakeCredentials);
    const isMe = sdk.isMe(notFakeConnection);
    expect(isMe).to.eq(false);
    done();
  });
});
