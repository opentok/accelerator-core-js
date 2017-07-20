const OTKAnalytics = require('opentok-solutions-logging');

// eslint-disable-next-line no-console
const message = messageText => console.log(`otAccCore: ${messageText}`);

/** Analytics */

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

class Analytics {

  constructor(source, sessionId, connectionId, apikey, applicationName) {
    const otkanalyticsData = {
      clientVersion: 'js-vsol-x.y.z', // x.y.z filled by npm build script
      source,
      componentId: 'acceleratorCore',
      name: applicationName || 'coreAccelerator',
      partnerId: apikey,
    };

    this.analytics = new OTKAnalytics(otkanalyticsData);

    if (connectionId) {
      this.update(sessionId, connectionId, apikey);
    }
  }

  update = (sessionId, connectionId, apiKey) => {
    if (sessionId && connectionId && apiKey) {
      const sessionInfo = {
        sessionId,
        connectionId,
        partnerId: apiKey,
      };
      this.analytics.addSessionInfo(sessionInfo);
    }
  };

  log = (action, variation) => {
    this.analytics.logEvent({ action, variation });
  };
}

module.exports = {
  Analytics,
  logVariation,
  logAction,
  message,
};

