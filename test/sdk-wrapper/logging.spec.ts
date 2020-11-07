import { expect } from 'chai';
import sinon from 'sinon';
import 'mocha';

import log from '../../src/sdk-wrapper/logging';

describe('SDK: Logging', () => {
  it('should log message to console', () => {
    let loggedMessage = '';
    sinon.stub(console, 'log').callsFake((message: string) => {
      loggedMessage = message;
    });

    log('test message');
    expect(loggedMessage).to.equal(`otSDK: test message`);
  });
});
