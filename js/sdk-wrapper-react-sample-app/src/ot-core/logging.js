'use strict';

var OTKAnalytics = require('opentok-solutions-logging');

var analytics = null;

// eslint-disable-next-line no-console
var message = function message(messageText) {
  return console.log('otAccCore: ' + messageText);
};

var error = function error(errorMessage) {
  throw new Error('otAccCore: ' + errorMessage);
};

var logVariation = {
  attempt: 'Attempt',
  success: 'Success',
  fail: 'Fail'
};

var logAction = {
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
  unsubscribe: 'UnsubscribeCoreAcc'
};

var initLogAnalytics = function initLogAnalytics(source, sessionId, connectionId, apikey) {
  var otkanalyticsData = {
    clientVersion: 'js-vsol-1.0.0',
    source: source,
    componentId: 'coreAccelerator',
    name: 'coreAccelerator',
    partnerId: apikey
  };

  analytics = new OTKAnalytics(otkanalyticsData);

  if (connectionId) {
    updateLogAnalytics(sessionId, connectionId, apikey);
  }
};

var updateLogAnalytics = function updateLogAnalytics(sessionId, connectionId, apiKey) {
  if (sessionId && connectionId && apiKey) {
    var sessionInfo = {
      sessionId: sessionId,
      connectionId: connectionId,
      partnerId: apiKey
    };
    analytics.addSessionInfo(sessionInfo);
  }
};

var log = function log(action, variation) {
  analytics.logEvent({ action: action, variation: variation });
};

module.exports = {
  message: message,
  error: error,
  logAction: logAction,
  logVariation: logVariation,
  initLogAnalytics: initLogAnalytics,
  updateLogAnalytics: updateLogAnalytics,
  log: log
};