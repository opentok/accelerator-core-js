"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeOT = exports.fakePublisher = exports.fakeStream = exports.fakeSession = exports.notFakeConnection = exports.fakeConnection = exports.fakeCredentials = exports.sessionId = exports.connectionId = void 0;
var uuid_1 = require("uuid");
var models_1 = require("../src/models");
exports.connectionId = uuid_1.v4();
exports.sessionId = uuid_1.v4();
exports.fakeCredentials = new models_1.Credential('fakeApiKey', 'fakeSessionId', 'fakeToken');
exports.fakeConnection = {
    connectionId: exports.connectionId,
    creationTime: new Date().getTime(),
    data: ''
};
exports.notFakeConnection = {
    connectionId: uuid_1.v4(),
    creationTime: new Date().getTime(),
    data: ''
};
exports.fakeSession = {
    connection: exports.fakeConnection,
    sessionId: exports.sessionId,
    connect: function () {
        return;
    },
    off: function () {
        return;
    },
    on: function () {
        return;
    }
};
exports.fakeStream = {
    connection: exports.fakeConnection,
    creationTime: new Date().getTime(),
    frameRate: 30,
    hasAudio: true,
    hasVideo: true,
    name: uuid_1.v4(),
    streamId: uuid_1.v4(),
    videoDimensions: {
        width: 1920,
        height: 1080
    },
    videoType: 'camera'
};
exports.fakePublisher = {
    element: undefined,
    id: uuid_1.v4(),
    stream: exports.fakeStream,
    session: exports.fakeSession
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.fakeOT = function () {
    return {
        initSession: function () {
            return exports.fakeSession;
        },
        initPublisher: function () {
            return exports.fakePublisher;
        }
    };
};
//# sourceMappingURL=common.js.map