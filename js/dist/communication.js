'use strict';

/* eslint-disable */
var logging = require('./logging');
var state = require('./state');
var session = undefined;
var accPack = undefined;
var callProperties = undefined;
var screenProperties = undefined;
var containers = {};
var active = false;

var defaultCallProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off'
  }
};

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param {String} text
 * @returns {String}
 */
var properCase = function properCase(text) {
  return '' + text[0].toUpperCase() + text.slice(1);
};

/**
 * Trigger an event through the API layer
 * @param {String} event - The name of the event
 * @param {*} [data]
 */
var triggerEvent = function triggerEvent(event, data) {
  return accPack.triggerEvent(event, data);
};

/** Create a camera publisher object */
var createPublisher = function createPublisher() {
  return new Promise(function (resolve, reject) {
    // TODO: Handle adding 'name' option to props
    var props = Object.assign({}, callProperties);
    // TODO: Figure out how to handle common vs package-specific options
    var container = containers.publisher.camera || 'publisherContainer';
    var publisher = OT.initPublisher(container, props, function (error) {
      error ? reject(error) : resolve(publisher);
    });
  });
};

/** Publish a camera stream */
var publish = function publish() {
  return new Promise(function (resolve, reject) {
    createPublisher().then(function (publisher) {
      state.addPublisher('camera', publisher);
      session.publish(publisher);
      resolve();
    }).catch(function (error) {
      var errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
      triggerEvent('error', errorMessage);
      reject(error);
    });
  });
};

/**
 * Subscribe to a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Promise} <resolve: >
 */
var subscribe = function subscribe(stream) {
  return new Promise(function (resolve, reject) {
    if (state.getStreams()[stream.id]) {
      resolve();
    }
    var type = stream.videoType;
    var container = containers.subscriber[type] || 'subscriberContainer';
    var options = type === 'camera' ? callProperties : screenProperties;
    var subscriber = session.subscribe(stream, container, options, function (error) {
      if (error) {
        reject(error);
      } else {
        state.addSubscriber(subscriber);
        triggerEvent('subscribeTo' + properCase(type), Object.assign({}, { subscriber: subscriber }, state.currentPubSub()));
        type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
        resolve();
      }
    });
  });
};

/**
 * Start publishing the local camera feed and subscribing to streams in the session
 */
var startCall = function startCall() {
  return new Promise(function (resolve, reject) {
    publish().then(function () {
      var streams = state.getStreams();
      console.log('initial Streams', streams);
      var initialSubscriptions = Object.keys(state.getStreams()).map(function (streamId) {
        return subscribe(streams[streamId]);
      });
      Promise.all(initialSubscriptions).then(function () {
        var pubSubData = state.currentPubSub();
        triggerEvent('startCall', pubSubData);
        active = true;
        resolve(pubSubData);
      }, function (reason) {
        return logging.log('Failed to subscribe to all existing streams: ' + reason);
      });
    });
  });
};

/**
 * Stop publishing and unsubscribe from all streams
 */
var endCall = function endCall() {
  var publishers = state.currentPubSub().publishers;

  var unpublish = function unpublish(publisher) {
    return session.unpublish(publisher);
  };
  Object.keys(publishers.camera).forEach(function (id) {
    return unpublish(publishers.camera[id]);
  });
  Object.keys(publishers.screen).forEach(function (id) {
    return unpublish(publishers.screen[id]);
  });
  state.removeAllPublishers();
  active = false;
};

/**
 * Enable/disable local audio or video
 * @param {String} source - 'audio' or 'video'
 * @param {Boolean} enable
 */
var enableLocalAV = function enableLocalAV(id, source, enable) {
  var method = 'publish' + properCase(source);

  var _state$currentPubSub = state.currentPubSub();

  var publishers = _state$currentPubSub.publishers;

  publishers.camera[id][method](enable);
};

/**
 * Enable/disable remote audio or video
 * @param {String} subscriberId
 * @param {String} source - 'audio' or 'video'
 * @param {Boolean} enable
 */
var enableRemoteAV = function enableRemoteAV(subscriberId, source, enable) {
  var method = 'subscribeTo' + properCase(source);

  var _state$currentPubSub2 = state.currentPubSub();

  var subscribers = _state$currentPubSub2.subscribers;

  var sub = subscribers.camera[subscriberId];
  console.log('OXOXOXO', sub.isSubscribing());
  subscribers.camera[subscriberId][method](enable);
};

var validateOptions = function validateOptions(options) {
  var requiredOptions = ['session', 'publishers', 'subscribers', 'streams', 'accPack'];

  requiredOptions.forEach(function (option) {
    if (!options[option]) {
      logging.error(option + ' is a required option.');
    }
  });

  session = options.session;
  accPack = options.accPack;
  containers = options.containers;
  callProperties = options.callProperties || defaultCallProperties;
  screenProperties = options.screenProperties || Object.assign({}, defaultCallProperties, { videoSource: 'window' });
};

var onStreamCreated = function onStreamCreated(_ref) {
  var stream = _ref.stream;
  return active && subscribe(stream);
};

var onStreamDestroyed = function onStreamDestroyed(_ref2) {
  var stream = _ref2.stream;

  state.removeStream(stream);
  var type = stream.videoType;
  type === 'screen' && triggerEvent('endViewingSharedScreen'); // Legacy event
  triggerEvent('unsubscribeFrom' + properCase(type), state.currentPubSub());
};

// Register listeners with the API
var createEventListeners = function createEventListeners() {
  accPack.on('streamCreated', onStreamCreated);
  accPack.on('streamDestroyed', onStreamDestroyed);
};

/**
 * Initialize the communication component
 * @param {Object} options
 * @param {Object} options.session
 * @param {Object} options.publishers
 * @param {Object} options.subscribers
 * @param {Object} options.streams
 */
var init = function init(options) {
  return new Promise(function (resolve) {
    validateOptions(options);
    createEventListeners();
    resolve();
  });
};

module.exports = {
  init: init,
  startCall: startCall,
  endCall: endCall,
  enableLocalAV: enableLocalAV,
  enableRemoteAV: enableRemoteAV
};