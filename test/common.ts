import { Credential } from '../src/models';

export const fakeCredentials: Credential = new Credential(
  'fakeApiKey',
  'fakeSessionId',
  'fakeToken'
);
