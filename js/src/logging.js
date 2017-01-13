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
  init: 'Init',
  initPackages: 'InitPackages',
  connect: 'ConnectCoreAcc',
  disconnect: 'DisconnectCoreAcc',
  forceDisconnect: 'ForceDisconnectCoreAcc',
  forceUnpublish: 'ForceUnpublishCoreAcc',
  getAccPack: 'GetAccPack',
  signal: 'SignalCoreAcc',
  startCall: 'StartCallCoreAcc',
  endCall: 'EndCallCoreAcc',
  toggleLocalAudio: 'ToggleLocalAudio',
  toggleLocalVideo: 'ToggleLocalVideo',
  toggleRemoteAudio: 'ToggleRemoteAudio',
  toggleRemoteVideo: 'ToggleRemoteVideo',
  subscribe: 'SubscribeCoreAcc',
  unsubscribe: 'UnsubscribeCoreAcc',
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
    updateLogAnalytics(sessionId, connectionId, apikey);
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
