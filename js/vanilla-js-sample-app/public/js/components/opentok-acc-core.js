(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* eslint-disable */
var logging = require('./logging');
var state = require('./state');
var session = void 0;
var accPack = void 0;
var callProperties = void 0;
var screenProperties = void 0;
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

},{"./logging":4,"./state":5}],2:[function(require,module,exports){
(function (global){
'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global OT */
/**
 * Dependencies
 */
var logging = require('./logging');
var communication = require('./communication');
var accPackEvents = require('./events');
var state = require('./state');

/**
 * Individual Accelerator Packs
 */
var textChat = void 0;
var screenSharing = void 0;
var annotation = void 0;
var archiving = void 0;

/** Eventing */

var registeredEvents = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 * @returns {function} See triggerEvent
 */
var registerEvents = function registerEvents(events) {
  var eventList = Array.isArray(events) ? events : [events];
  eventList.forEach(function (event) {
    if (!registeredEvents[event]) {
      registeredEvents[event] = new Set();
    }
  });
};

/**
 * Register a callback for a specific event
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
var on = function on(event, callback) {
  var eventCallbacks = registeredEvents[event];
  if (!eventCallbacks) {
    logging.log(event + ' is not a registered event.');
  } else {
    eventCallbacks.add(callback);
  }
};

/**
 * Trigger an event and fire all registered callbacks
 * @param {String} event - The name of the event
 * @param {*} data - Data to be passed to callback functions
 */
var triggerEvent = function triggerEvent(event, data) {
  var eventCallbacks = registeredEvents[event];
  if (!eventCallbacks) {
    registerEvents(event);
    logging.log(event + ' has been registered as a new event.');
  } else {
    eventCallbacks.forEach(function (callback) {
      return callback(data, event);
    });
  }
};

/** Returns the current OpenTok session object */
// const getSession = () => session;
var getSession = void 0;

/** Returns the current OpenTok session credentials */
var getCredentials = void 0;

/** Returns the options used for initialization */
var getOptions = void 0;

var createEventListeners = function createEventListeners(session, options) {
  Object.keys(accPackEvents).forEach(function (type) {
    return registerEvents(accPackEvents[type]);
  });

  /**
   * If using screen sharing + annotation in an external window, the individual packages
   * will take care of
   */
  var usingAnnotation = options.screenSharing.annotation;
  var internalAnnotation = usingAnnotation && !options.screenSharing.externalWindow;

  session.on({
    streamCreated: function streamCreated(event) {
      state.addStream(event.stream);
      triggerEvent('streamCreated', event);
    },
    streamDestroyed: function streamDestroyed(event) {
      state.removeStream(event.stream);
      // delete streams[event.stream.id];
      triggerEvent('streamDestroyed', event);
    }
  });

  if (usingAnnotation) {
    on('subscribeToScreen', function (_ref) {
      var subscriber = _ref.subscriber;

      annotation.start(getSession()).then(function () {
        return annotation.linkCanvas(subscriber, subscriber.element.parentElement);
      });
    });

    on('unsubscribeFromScreen', function () {
      annotation.end();
    });
  }

  on('startScreenSharing', function (publisher) {
    state.addPublisher('screen', publisher);
    triggerEvent('startScreenShare', Object.assign({}, { publisher: publisher }, state.currentPubSub()));
    // publishers.screen[publisher.id] = publisher;
    if (internalAnnotation) {
      annotation.start(getSession()).then(function () {
        return annotation.linkCanvas(publisher, publisher.element.parentElement);
      });
    }
  });

  on('endScreenSharing', function (publisher) {
    // delete publishers.screen[publisher.id];
    state.removePublisher('screen', publisher);
    triggerEvent('endScreenShare', state.currentPubSub());
    if (internalAnnotation) {
      annotation.end();
    }
  });
};

var setupExternalAnnotation = function setupExternalAnnotation() {
  return annotation.start(getSession(), {
    screensharing: true
  });
};

var linkAnnotation = function linkAnnotation(pubSub, annotationContainer, externalWindow) {
  annotation.linkCanvas(pubSub, annotationContainer, {
    externalWindow: externalWindow
  });

  if (externalWindow) {
    (function () {
      // Add subscribers to the external window
      var streams = state.getStreams();
      var cameraStreams = Object.keys(streams).reduce(function (acc, streamId) {
        var stream = streams[streamId];
        return stream.videoType === 'camera' ? acc.concat(stream) : acc;
      }, []);
      cameraStreams.forEach(annotation.addSubscriberToExternalWindow);
    })();
  }
};

var initPackages = function initPackages() {
  var session = getSession();
  var options = getOptions();

  var optionalRequire = function optionalRequire(packageName, globalName) {
    var result = void 0;
    /* eslint-disable global-require, import/no-extraneous-dependencies */
    try {
      switch (packageName) {
        case 'opentok-text-chat':
          result = require('opentok-text-chat');
          break;
        case 'opentok-screen-sharing':
          result = require('opentok-screen-sharing');
          break;
        case 'opentok-annotation':
          result = require('opentok-annotation');
          break;
        case 'opentok-archiving':
          result = require('opentok-archiving');
          break;
        default:
          break;
      }
      /* eslint-enable global-require */
    } catch (error) {
      result = window[globalName];
    }
    if (!result) {
      logging.error('Could not load ' + packageName);
    }
    return result;
  };

  var availablePackages = {
    textChat: function textChat() {
      return optionalRequire('opentok-text-chat', 'TextChatAccPack');
    },
    screenSharing: function screenSharing() {
      return optionalRequire('opentok-screen-sharing', 'ScreenSharingAccPack');
    },
    annotation: function annotation() {
      return optionalRequire('opentok-annotation', 'AnnotationAccPack');
    },
    archiving: function archiving() {
      return optionalRequire('opentok-archiving', 'ArchivingAccPack');
    }
  };

  var packages = {};
  options.packages.forEach(function (acceleratorPack) {
    if (availablePackages[acceleratorPack]) {
      // eslint-disable-next-line no-param-reassign
      var packageName = '' + acceleratorPack[0].toUpperCase() + acceleratorPack.slice(1);
      packages[packageName] = availablePackages[acceleratorPack]();
    } else {
      logging.log(acceleratorPack + ' is not a valid accelerator pack');
    }
  });

  /** Build containers hash */
  var containerOptions = options.containers || {};
  var getDefaultContainer = function getDefaultContainer(pubSub) {
    return document.getElementById(pubSub + 'Container');
  };
  var getContainerElement = function getContainerElement(pubSub, type) {
    var definedContainer = containerOptions[pubSub] ? containerOptions[pubSub][type] : null;
    if (definedContainer) {
      return typeof definedContainer === 'string' ? document.querySelector(definedContainer) : definedContainer;
    }
    return getDefaultContainer(pubSub);
  };
  var getContainerElements = function getContainerElements() {
    var controls = containerOptions.controls || '#videoControls';
    var chat = containerOptions.chat || '#chat';
    return ['publisher', 'subscriber'].reduce(function (acc, pubSub) {
      return Object.assign({}, acc, _defineProperty({}, pubSub, ['camera', 'screen'].reduce(function (containerAcc, type) {
        return Object.assign({}, containerAcc, _defineProperty({}, type, getContainerElement(pubSub, type)));
      }, {})));
    }, { controls: controls, chat: chat });
  };

  /** Get options based on package */
  var packageOptions = function packageOptions(packageName) {
    var _state$all = state.all();

    var streams = _state$all.streams;
    var streamMap = _state$all.streamMap;
    var publishers = _state$all.publishers;
    var subscribers = _state$all.subscribers;

    var accPack = {
      registerEventListener: on,
      on: on,
      registerEvents: registerEvents,
      triggerEvent: triggerEvent,
      setupExternalAnnotation: setupExternalAnnotation,
      linkAnnotation: linkAnnotation
    };
    var containers = getContainerElements();
    var commOptions = packageName === 'communication' ? Object.assign({}, options.communication, { publishers: publishers, subscribers: subscribers, streams: streams, streamMap: streamMap, containers: containers }) : {};
    var chatOptions = packageName === 'textChat' ? {
      textChatContainer: containers.chat,
      waitingMessage: options.textChat.waitingMessage,
      sender: { alias: options.textChat.name }
    } : {};
    var screenSharingOptions = packageName === 'screenSharing' ? Object.assign({}, options.screenSharing, { screenSharingContainer: containers.publisher.screen }) : {};
    var controlsContainer = containers.controls; // Legacy option
    return Object.assign({}, options[packageName], commOptions, chatOptions, { session: session, accPack: accPack, controlsContainer: controlsContainer }, screenSharingOptions);
  };

  /** Create instances of each package */
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  communication.init(packageOptions('communication'));
  textChat = packages.TextChat ? new packages.TextChat(packageOptions('textChat')) : null;
  screenSharing = packages.ScreenSharing ? new packages.ScreenSharing(packageOptions('screenSharing')) : null;
  annotation = packages.Annotation ? new packages.Annotation(packageOptions('annotation')) : null;
  archiving = packages.Archiving ? new packages.Archiving(packageOptions('archiving')) : null;
};

/**
 * Ensures that we have the required credentials
 * @param {Object} credentials
 * @param {String} credentials.apiKey
 * @param {String} credentials.sessionId
 * @param {String} credentials.token
 */
var validateCredentials = function validateCredentials() {
  var credentials = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  var required = ['apiKey', 'sessionId', 'token'];
  required.forEach(function (credential) {
    if (!credentials[credential]) {
      logging.error(credential + ' is a required credential');
    }
  });
};

/**
 * Connect to the session
 */
var connect = function connect() {
  return new Promise(function (resolve, reject) {
    var session = getSession();

    var _getCredentials = getCredentials();

    var token = _getCredentials.token;

    session.connect(token, function (error) {
      if (error) {
        logging.message(error);
        reject(error);
      }
      initPackages();
      resolve();
    });
  });
};

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
var toggleLocalAudio = function toggleLocalAudio(enable) {
  var _state$currentPubSub = state.currentPubSub();

  var publishers = _state$currentPubSub.publishers;

  var toggleAudio = function toggleAudio(id) {
    return communication.enableLocalAV(id, 'audio', enable);
  };
  Object.keys(publishers.camera).forEach(toggleAudio);
};

/**
 * Enable or disable local video
 * @param {Boolean} enable
 */
var toggleLocalVideo = function toggleLocalVideo(enable) {
  var _state$currentPubSub2 = state.currentPubSub();

  var publishers = _state$currentPubSub2.publishers;

  var toggleVideo = function toggleVideo(id) {
    return communication.enableLocalAV(id, 'video', enable);
  };
  Object.keys(publishers.camera).forEach(toggleVideo);
};

/**
 * Enable or disable remote audio
 * @param {String} id - Publisher id
 * @param {Boolean} enable
 */
var toggleRemoteAudio = function toggleRemoteAudio(id, enable) {
  return communication.enableRemoteAV(id, 'audio', enable);
};

/**
 * Enable or disable local video
 * @param {String} id - Publisher id
 * @param {Boolean} enable
 */
var toggleRemoteVideo = function toggleRemoteVideo(id, enable) {
  return communication.enableRemoteAV(id, 'video', enable);
};

/**
 * Initialize the accelerator pack
 * @param {Object} options
 * @param {Object} options.credentials
 */
var init = function init(options) {
  if (!options) {
    logging.error('Missing options required for initialization');
  }
  var credentials = options.credentials;

  validateCredentials(options.credentials);
  var session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  getSession = function getSession() {
    return session;
  };
  getCredentials = function getCredentials() {
    return credentials;
  };
  getOptions = function getOptions() {
    return options;
  };
};

var opentokCore = {
  init: init,
  connect: connect,
  getSession: getSession,
  getCredentials: getCredentials,
  registerEvents: registerEvents,
  on: on,
  registerEventListener: on,
  triggerEvent: triggerEvent,
  startCall: communication.startCall,
  endCall: communication.endCall,
  toggleLocalAudio: toggleLocalAudio,
  toggleLocalVideo: toggleLocalVideo,
  toggleRemoteAudio: toggleRemoteAudio,
  toggleRemoteVideo: toggleRemoteVideo
};

if (global === window) {
  window.otCore = opentokCore;
}

module.exports = opentokCore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./communication":1,"./events":3,"./logging":4,"./state":5,"opentok-annotation":undefined,"opentok-archiving":undefined,"opentok-screen-sharing":undefined,"opentok-text-chat":undefined}],3:[function(require,module,exports){
'use strict';

var events = {
  core: ['connected', 'streamCreated', 'streamDestroyed', 'startScreenShare', 'endScreenShare', 'error'],
  communication: ['startCall', 'endCall', 'callPropertyChanged', 'subscribeToCamera', 'subscribeToScreen', 'unsubscribeFromCamera', 'unsubscribeFromScreen', 'startViewingSharedScreen', 'endViewingSharedScreen'],
  textChat: ['showTextChat', 'hideTextChat', 'messageSent', 'errorSendingMessage', 'messageReceived'],
  screenSharing: ['startScreenSharing', 'endScreenSharing', 'screenSharingError'],
  annotation: ['startAnnotation', 'linkAnnotation', 'resizeCanvas', 'annotationWindowClosed', 'endAnnotation'],
  archiving: ['startArchive', 'stopArchive', 'archiveReady', 'archiveError']
};

module.exports = events;

},{}],4:[function(require,module,exports){
"use strict";

// eslint-disable-next-line no-console
var log = function log(message) {
  return console.log("otAccCore: " + message);
};

var error = function error(message) {
  throw new Error("otAccCore: " + message);
};

module.exports = {
  log: log,
  error: error
};

},{}],5:[function(require,module,exports){
"use strict";

// Map publisher ids to publisher objects
var publishers = {
  camera: {},
  screen: {}
};

// Map subscriber id to subscriber objects
var subscribers = {
  camera: {},
  screen: {}
};

// Map stream ids to stream objects
var streams = {};

// Map stream ids to subscriber/publisher ids
var streamMap = {};

/**
 * Returns the count of current publishers and subscribers by type
 * @retuns {Object}
 *    {
 *      publishers: {
 *        camera: 1,
 *        screen: 1,
 *        total: 2
 *      },
 *      subscribers: {
 *        camera: 3,
 *        screen: 1,
 *        total: 4
 *      }
 *   }
 */
var pubSubCount = function pubSubCount() {
  var pubs = Object.keys(publishers).reduce(function (acc, source) {
    acc[source] = Object.keys(publishers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  var subs = Object.keys(subscribers).reduce(function (acc, source) {
    acc[source] = Object.keys(subscribers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 */
var currentPubSub = function currentPubSub() {
  return { publishers: publishers, subscribers: subscribers, meta: pubSubCount() };
};

var addPublisher = function addPublisher(type, publisher) {
  streamMap[publisher.streamId] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

var removePublisher = function removePublisher(type, publisher) {
  var id = publisher.id || streamMap[publisher.streamId];
  delete publishers[type][id];
};

var removeAllPublishers = function removeAllPublishers() {
  publishers.camera = {};
  publishers.screen = {};
};

var addSubscriber = function addSubscriber(subscriber) {
  var type = subscriber.stream.videoType;
  var streamId = subscriber.stream.id;
  subscribers[type][subscriber.id] = subscriber;
  streamMap[streamId] = subscriber.id;
};

var addStream = function addStream(stream) {
  streams[stream.id] = stream;
};

var removeStream = function removeStream(stream) {
  var type = stream.videoType;
  var subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};

var getStreams = function getStreams() {
  return streams;
};

var all = function all() {
  return Object.assign({}, currentPubSub(), { streams: streams, streamMap: streamMap });
};

module.exports = {
  addStream: addStream,
  removeStream: removeStream,
  getStreams: getStreams,
  addPublisher: addPublisher,
  removePublisher: removePublisher,
  removeAllPublishers: removeAllPublishers,
  addSubscriber: addSubscriber,
  currentPubSub: currentPubSub,
  all: all
};

},{}]},{},[2]);
