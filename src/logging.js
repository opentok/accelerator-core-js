const OTKAnalytics = require('opentok-solutions-logging');

// eslint-disable-next-line no-console
const message = messageText => console.log(`otAccCore: ${messageText}`);

/** Analytics */

let analytics = null;

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

const initLogAnalytics = (source, sessionId, connectionId, apikey) => {
  const otkanalyticsData = {
    clientVersion: 'js-vsol-1.0.11',
    source,
    componentId: 'acceleratorCore',
    name: 'coreAccelerator',
    partnerId: apikey,
  };

  analytics = new OTKAnalytics(otkanalyticsData);

  if (connectionId) {
    updateLogAnalytics(sessionId, connectionId, apikey);
  }
};

const logAnalytics = (action, variation) => {
  analytics.logEvent({ action, variation });
};

module.exports = {
  message,
  logAction,
  logVariation,
  initLogAnalytics,
  updateLogAnalytics,
  logAnalytics,
};
