'use strict';

var _arguments = arguments;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global OT */
/**
 * Dependencies
 */
var logging = require('./logging');
var communication = require('./communication');
var accPackEvents = require('./events');
var internalState = require('./state');

var _require = require('./util');

var dom = _require.dom;
var path = _require.path;
var properCase = _require.properCase;

/**
 * Individual Accelerator Packs
 */

var textChat = undefined; // eslint-disable-line no-unused-vars
var screenSharing = undefined; // eslint-disable-line no-unused-vars
var annotation = undefined;
var archiving = undefined; // eslint-disable-line no-unused-vars

/** Eventing */

var eventListeners = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 * @returns {function} See triggerEvent
 */
var registerEvents = function registerEvents(events) {
  var eventList = Array.isArray(events) ? events : [events];
  eventList.forEach(function (event) {
    if (!eventListeners[event]) {
      eventListeners[event] = new Set();
    }
  });
};

/**
 * Register a callback for a specific event or pass an object with
 * with event => callback key/value pairs to register listeners for
 * multiple events.
 * @param {String | Object} event - The name of the event
 * @param {Function} callback
 */
var on = function on(event, callback) {
  if ((typeof event === 'undefined' ? 'undefined' : _typeof(event)) === 'object') {
    Object.keys(event).forEach(function (eventName) {
      on(eventName, event[eventName]);
    });
  }
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    logging.message(event + ' is not a registered event.');
  } else {
    eventCallbacks.add(callback);
  }
};

/**
 * Remove a callback for a specific event.  If no parameters are passed,
 * all event listeners will be removed.
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
var off = function off(event, callback) {
  if (_arguments.lenth === 0) {
    Object.keys(eventListeners).forEach(function (eventType) {
      eventListeners[eventType].clear();
    });
  }
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    logging.message(event + ' is not a registered event.');
  } else {
    eventCallbacks.delete(callback);
  }
};

/**
 * Trigger an event and fire all registered callbacks
 * @param {String} event - The name of the event
 * @param {*} data - Data to be passed to callback functions
 */
var triggerEvent = function triggerEvent(event, data) {
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    registerEvents(event);
    logging.message(event + ' has been registered as a new event.');
  } else {
    eventCallbacks.forEach(function (callback) {
      return callback(data, event);
    });
  }
};

/** Returns the current OpenTok session object */
var getSession = internalState.getSession;

/** Returns the current OpenTok session credentials */
var getCredentials = internalState.getCredentials;

/** Returns the options used for initialization */
var getOptions = internalState.getOptions;

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

  /**
   * Wrap session events and update internalState when streams are created
   * or destroyed
   */
  accPackEvents.session.forEach(function (eventName) {
    session.on(eventName, function (event) {
      if (eventName === 'streamCreated') {
        internalState.addStream(event.stream);
      }
      if (eventName === 'streamDestroyed') {
        internalState.removeStream(event.stream);
      }
      triggerEvent(eventName, event);
    });
  });

  if (usingAnnotation) {
    on('subscribeToScreen', function (_ref) {
      var subscriber = _ref.subscriber;

      annotation.start(getSession()).then(function () {
        var absoluteParent = dom.query(path('annotation.absoluteParent.subscriber', options));
        var linkOptions = absoluteParent ? { absoluteParent: absoluteParent } : null;
        annotation.linkCanvas(subscriber, subscriber.element.parentElement, linkOptions);
      });
    });

    on('unsubscribeFromScreen', function () {
      annotation.end();
    });
  }

  on('startScreenSharing', function (publisher) {
    internalState.addPublisher('screen', publisher);
    triggerEvent('startScreenShare', Object.assign({}, { publisher: publisher }, internalState.getPubSub()));
    if (internalAnnotation) {
      annotation.start(getSession()).then(function () {
        var absoluteParent = dom.query(path('annotation.absoluteParent.publisher', options));
        var linkOptions = absoluteParent ? { absoluteParent: absoluteParent } : null;
        annotation.linkCanvas(publisher, publisher.element.parentElement, linkOptions);
      });
    }
  });

  on('endScreenSharing', function (publisher) {
    // delete publishers.screen[publisher.id];
    internalState.removePublisher('screen', publisher);
    triggerEvent('endScreenShare', internalState.getPubSub());
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
      var streams = internalState.getStreams();
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

  /**
   * Try to require a package.  If 'require' is unavailable, look for
   * the package in global scope.  A switch internalStatement is used because
   * webpack and Browserify aren't able to resolve require internalStatements
   * that use variable names.
   * @param {String} packageName - The name of the npm package
   * @param {String} globalName - The name of the package if exposed on global/window
   * @returns {Object}
   */
  var optionalRequire = function optionalRequire(packageName, globalName) {
    var result = undefined;
    /* eslint-disable global-require, import/no-extraneous-dependencies, import/no-unresolved */
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
      packages[properCase(acceleratorPack)] = availablePackages[acceleratorPack]();
    } else {
      logging.message(acceleratorPack + ' is not a valid accelerator pack');
    }
  });

  /**
   * Build video containers object
   */
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
  /** *** *** *** *** */

  /**
   * Return options for the specified package
   * @param {String} packageName
   * @returns {Object}
   */
  var packageOptions = function packageOptions(packageName) {
    var _internalState$all = internalState.all();

    var streams = _internalState$all.streams;
    var streamMap = _internalState$all.streamMap;
    var publishers = _internalState$all.publishers;
    var subscribers = _internalState$all.subscribers;

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
 * @returns {Promise} <resolve: -, reject: Error>
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
* Disconnect from the session
* @returns {Promise} <resolve: -, reject: Error>
*/
var disconnect = function disconnect() {
  getSession().disconnect();
  internalState.reset();
};

/**
 * Force a remote connection to leave the session
 * @param {Object} connection
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var forceDisconnect = function forceDisconnect(connection) {
  return new Promise(function (resolve, reject) {
    getSession().forceDisconnect(connection, function (error) {
      error ? reject(error) : resolve();
    });
  });
};

/**
 * Force the publisher of a stream to stop publishing the stream
 * @param {Object} stream
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var forceUnpublish = function forceUnpublish(stream) {
  return new Promise(function (resolve, reject) {
    getSession().forceUnpublish(stream, function (error) {
      error ? reject(error) : resolve();
    });
  });
};

/**
 * Get the local publisher object for a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Object} - The publisher object
 */
var getPublisherForStream = function getPublisherForStream(stream) {
  return getSession().getPublisherForStream(stream);
};

/**
 * Get the local subscriber objects for a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Array} - An array of subscriber object
 */
var getSubscribersForStream = function getSubscribersForStream(stream) {
  return getSession().getSubscribersForStream(stream);
};

/**
 * Send a signal using the OpenTok signaling apiKey
 * @param {Object} signal
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var signal = function signal(signalObj) {
  return new Promise(function (resolve, reject) {
    getSession().signal(signalObj, function (error) {
      error ? reject(error) : resolve();
    });
  });
};

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
var toggleLocalAudio = function toggleLocalAudio(enable) {
  var _internalState$getPub = internalState.getPubSub();

  var publishers = _internalState$getPub.publishers;

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
  var _internalState$getPub2 = internalState.getPubSub();

  var publishers = _internalState$getPub2.publishers;

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
 * @param {Array} [options.packages]
 * @param {Object} [options.containers]
 */
var init = function init(options) {
  if (!options) {
    logging.error('Missing options required for initialization');
  }
  var credentials = options.credentials;

  validateCredentials(options.credentials);
  var session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  internalState.setSession(session);
  internalState.setCredentials(credentials);
  internalState.setOptions(options);
};

var opentokCore = {
  init: init,
  connect: connect,
  disconnect: disconnect,
  forceDisconnect: forceDisconnect,
  forceUnpublish: forceUnpublish,
  getOptions: getOptions,
  getSession: getSession,
  getPublisherForStream: getPublisherForStream,
  getSubscribersForStream: getSubscribersForStream,
  on: on,
  off: off,
  registerEventListener: on,
  triggerEvent: triggerEvent,
  signal: signal,
  state: internalState.all,
  startCall: communication.startCall,
  endCall: communication.endCall,
  toggleLocalAudio: toggleLocalAudio,
  toggleLocalVideo: toggleLocalVideo,
  toggleRemoteAudio: toggleRemoteAudio,
  toggleRemoteVideo: toggleRemoteVideo,
  subscribe: communication.subscribe,
  unsubscribe: communication.unsubscribe
};

if (global === window) {
  window.otCore = opentokCore;
}

module.exports = opentokCore;