import { v4 as uuidv4 } from 'uuid';

import { Credential } from '../src/models';

export const connectionId: string = uuidv4();
export const sessionId: string = uuidv4();

export const fakeCredentials: Credential = new Credential(
  'fakeApiKey',
  'fakeSessionId',
  'fakeToken'
);

export const fakeConnection: OT.Connection = {
  connectionId,
  creationTime: new Date().getTime(),
  data: ''
};

export const notFakeConnection: OT.Connection = {
  connectionId: uuidv4(),
  creationTime: new Date().getTime(),
  data: ''
};

export const fakeSession = {
  connection: fakeConnection,
  sessionId: sessionId,
  connect(): void {
    return;
  },
  off(): void {
    return;
  },
  on(): void {
    return;
  }
};

export const fakeStream: OT.Stream = {
  connection: fakeConnection,
  creationTime: new Date().getTime(),
  frameRate: 30,
  hasAudio: true,
  hasVideo: true,
  name: uuidv4(),
  streamId: uuidv4(),
  videoDimensions: {
    width: 1920,
    height: 1080
  },
  videoType: 'camera'
};

export const fakePublisher = {
  element: undefined,
  id: uuidv4(),
  stream: fakeStream,
  session: fakeSession
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fakeOT = (): any => {
  return {
    initSession() {
      return fakeSession;
    },
    initPublisher() {
      return fakePublisher;
    }
  };
};
