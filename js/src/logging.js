const OTKAnalytics = require('opentok-solutions-logging');

let analytics = null;

// eslint-disable-next-line no-console
const message = messageText => console.log(`otAccCore: ${messageText}`);

const error = (errorMessage) => {
  throw new Error(`otAccCore: ${errorMessage}`);
};

const logVariation = {
  attempt: 'Attempt',
  success: 'Success',
  fail: 'Fail',
};

const logAction = {
  // vars for the analytics logs. Internal use
  clientVersion: 'js-vsol-2.0.0',
  componentId: 'coreAccelerator',
  name: 'guidCoreAccelerator',
  init: 'Init',
  initPackages: 'InitPackages',
  connect: 'Connect',
  disconnect: 'Disconnect',
  forceDisconnect: 'ForceDisconnect',
  forceUnpublish: 'ForceUnpublish',
  getAccPack: 'GetAccPack',
  on: 'On',
  off: 'Off',
  signal: 'Signal',
  startCall: 'StartCall',
  endCall: 'EndCall',
  toggleLocalAudio: 'ToggleLocalAudio',
  toggleLocalVideo: 'ToggleLocalVideo',
  toggleRemoteAudio: 'ToggleRemoteAudio',
  toggleRemoteVideo: 'ToggleRemoteVideo',
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
};

const initLogAnalytics = (source, sessionId, connectionId, apikey) => {
  const otkanalyticsData = {
    clientVersion: 'js-vsol-1.0.0',
    source,
    componentId: 'coreAccelerator',
    name: 'coreAccelerator',
    partnerId: apikey,
  };

  analytics = new OTKAnalytics(otkanalyticsData);

  if (connectionId) {
    const sessionInfo = {
      sessionId,
      connectionId,
      partnerId: apikey,
    };
    analytics.addSessionInfo(sessionInfo);
  }
};


const updateLogAnalytics = (sessionId, connectionId, apiKey) => {
  if (sessionId && connectionId && apiKey) {
    const sessionInfo = {
      sessionId,
      connectionId,
      partnerId: apiKey,
    };
    analytics.addSessionInfo(sessionInfo);
  }
};

const log = (action, variation) => {
  console.log('OXOXOXO: ', action, variation);
  analytics.logEvent({ action, variation });
};

module.exports = {
  message,
  error,
  logAction,
  logVariation,
  initLogAnalytics,
  updateLogAnalytics,
  log,
};
