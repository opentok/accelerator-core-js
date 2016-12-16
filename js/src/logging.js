import OTKAnalytics from 'opentok-solutions-logging';

let analytics = null;

// eslint-disable-next-line no-console
const message = message => console.log(`otAccCore: ${message}`);

const error = (message) => {
  throw new Error(`otAccCore: ${message}`);
};

const logVariation = {
  attempt : "Attempt",
  success : "Success",
  fail : "Fail",
}

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
    source: source,
    componentId: 'coreAccelerator',
    name: 'coreAccelerator',
    partnerId: apikey
  };

  analytics = new OTKAnalytics(otkanalyticsData);

  if(connectionId) {
     const sessionInfo = {
      sessionId: sessionId,
      connectionId: connectionId,
      partnerId: apikey
    };
    analytics.addSessionInfo(sessionInfo);
  }
}
const updateLogAnalytics = (sessionId, connectionId, apikey) => {
  if(sessionId && connectionId && apikey) {
     const sessionInfo = {
      sessionId: sessionId,
      connectionId: connectionId,
      partnerId: apikey
    };
    analytics.addSessionInfo(sessionInfo);
  }
}

const log = (action, variation) => {
  let data = {
    action: action,
    variation: variation
  };
  analytics.logEvent(data);
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

