'use strict';

var _arguments = arguments;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/* global OT */
/**
 * Dependencies
 */
var logging = require('./logging');
var communication = require('./communication');
var accPackEvents = require('./events');
var internalState = require('./state');

var _require = require('./util'),
    dom = _require.dom,
    path = _require.path,
    properCase = _require.properCase;

/**
 * Individual Accelerator Packs
 */


var textChat = undefined; // eslint-disable-line no-unused-vars
var screenSharing = undefined; // eslint-disable-line no-unused-vars
var annotation = undefined;
var archiving = undefined; // eslint-disable-line no-unused-vars

/**
 * Get access to an accelerator pack
 * @param {String} packageName - textChat, screenSharing, annotation, or archiving
 * @returns {Object} The instance of the accelerator pack
 */
var getAccPack = function getAccPack(packageName) {
  logging.log(logging.logAction.getAccPack, logging.logVariation.attempt);
  var packages = {
    textChat: textChat,
    screenSharing: screenSharing,
    annotation: annotation,
    archiving: archiving
  };
  logging.log(logging.logAction.getAccPack, logging.logVariation.success);
  return packages[packageName];
};

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
  //logging.log(logging.logAction.on, logging.logVariation.attempt);
  if ((typeof event === 'undefined' ? 'undefined' : _typeof(event)) === 'object') {
    Object.keys(event).forEach(function (eventName) {
      on(eventName, event[eventName]);
    });
  }
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    logging.message(event + ' is not a registered event.');
    // logging.log(logging.logAction.on, logging.logVariation.fail);
  } else {
      eventCallbacks.add(callback);
      // logging.log(logging.logAction.on, logging.logVariation.success);
    }
};

/**
 * Remove a callback for a specific event.  If no parameters are passed,
 * all event listeners will be removed.
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
var off = function off(event, callback) {
  // logging.log(logging.logAction.off, logging.logVariation.attempt);
  if (_arguments.lenth === 0) {
    Object.keys(eventListeners).forEach(function (eventType) {
      eventListeners[eventType].clear();
    });
  }
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    // logging.log(logging.logAction.off, logging.logVariation.fail);
    logging.message(event + ' is not a registered event.');
  } else {
    eventCallbacks.delete(callback);
    // logging.log(logging.logAction.off, logging.logVariation.success);
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

/**
 * Get the current OpenTok session object
 * @returns {Object}
 */
var getSession = internalState.getSession;

/**
 * Returns the current OpenTok session credentials
 * @returns {Object}
 */
var getCredentials = internalState.getCredentials;

/**
 * Returns the options used for initialization
 * @returns {Object}
 */
var getOptions = internalState.getOptions;

var createEventListeners = function createEventListeners(session, options) {
  Object.keys(accPackEvents).forEach(function (type) {
    return registerEvents(accPackEvents[type]);
  });

  /**
   * If using screen sharing + annotation in an external window, the individual packages
   * will take care of
   */
  var usingAnnotation = path('screenSharing.annotation', options);
  var internalAnnotation = usingAnnotation && !path('screenSharing.externalWindow', options);

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
  logging.log(logging.logAction.initPackages, logging.logVariation.attempt);

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
      logging.log(logging.logAction.initPackages, logging.logVariation.fail);
      logging.error('Could not load ' + packageName);
    }

    logging.log(logging.logAction.initPackages, logging.logVariation.success);
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
  (path('packages', options) || []).forEach(function (acceleratorPack) {
    if (availablePackages[acceleratorPack]) {
      // eslint-disable-next-line no-param-reassign
      packages[properCase(acceleratorPack)] = availablePackages[acceleratorPack]();
    } else {
      logging.message(acceleratorPack + ' is not a valid accelerator pack');
    }
  });

  /**
   * Get containers for streams, controls, and the chat widget
   */
  var getDefaultContainer = function getDefaultContainer(pubSub) {
    return document.getElementById(pubSub + 'Container');
  };
  var getContainerElements = function getContainerElements() {
    var controls = options.controlsContainer || '#videoControls';
    var chat = path('textChat.container', options) || '#chat';
    var stream = options.streamContainers || getDefaultContainer;
    return { stream: stream, controls: controls, chat: chat };
  };
  /** *** *** *** *** */

  /**
   * Return options for the specified package
   * @param {String} packageName
   * @returns {Object}
   */
  var packageOptions = function packageOptions(packageName) {
    var _internalState$all = internalState.all(),
        streams = _internalState$all.streams,
        streamMap = _internalState$all.streamMap,
        publishers = _internalState$all.publishers,
        subscribers = _internalState$all.subscribers;

    var accPack = {
      registerEventListener: on,
      on: on,
      registerEvents: registerEvents,
      triggerEvent: triggerEvent,
      setupExternalAnnotation: setupExternalAnnotation,
      linkAnnotation: linkAnnotation
    };
    var containers = getContainerElements();
    var commOptions = packageName === 'communication' ? Object.assign({}, options.communication, { publishers: publishers, subscribers: subscribers, streams: streams, streamMap: streamMap, streamContainers: containers.stream }) : {};
    var chatOptions = packageName === 'textChat' ? {
      textChatContainer: options.textChat.container,
      waitingMessage: options.textChat.waitingMessage,
      sender: { alias: options.textChat.name }
    } : {};
    var screenSharingOptions = packageName === 'screenSharing' ? Object.assign({}, options.screenSharing, { screenSharingContainer: dom.element(containers.stream('publisher', 'screen')) }) : {};
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

    var _getCredentials = getCredentials(),
        token = _getCredentials.token;

    session.connect(token, function (error) {
      logging.log(logging.logAction.connect, logging.logVariation.attempt);
      if (error) {
        logging.message(error);
        logging.log(logging.logAction.connect, logging.logVariation.fail);
        return reject(error);
      }
      var sessionId = session.sessionId,
          apiKey = session.apiKey;

      logging.updateLogAnalytics(sessionId, path('connection.connectionId', session), apiKey);
      logging.log(logging.logAction.connect, logging.logVariation.success);
      initPackages();
      return resolve();
    });
  });
};

/**
 * Disconnect from the session
 * @returns {Promise} <resolve: -, reject: Error>
 */
var disconnect = function disconnect() {
  logging.log(logging.logAction.disconnect, logging.logVariation.attempt);
  getSession().disconnect();
  internalState.reset();
  logging.log(logging.logAction.disconnect, logging.logVariation.success);
};

/**
 * Force a remote connection to leave the session
 * @param {Object} connection
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var forceDisconnect = function forceDisconnect(connection) {
  return new Promise(function (resolve, reject) {
    logging.log(logging.logAction.forceDisconnect, logging.logVariation.attempt);
    getSession().forceDisconnect(connection, function (error) {
      if (error) {
        logging.log(logging.logAction.forceDisconnect, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.forceDisconnect, logging.logVariation.success);
        resolve();
      }
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
    logging.log(logging.logAction.forceUnpublish, logging.logVariation.attempt);
    getSession().forceUnpublish(stream, function (error) {
      if (error) {
        logging.log(logging.logAction.forceUnpublish, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.forceUnpublish, logging.logVariation.success);
        resolve();
      }
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
 * @param {String} type
 * @param {*} [data]
 * @param {Object} to - An OpenTok connection object
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var signal = function signal(type, signalData, to) {
  return new Promise(function (resolve, reject) {
    logging.log(logging.logAction.signal, logging.logVariation.attempt);
    var session = getSession();
    var data = JSON.stringify(signalData);
    var signalObj = to ? { type: type, data: data, to: to } : { type: type, data: data };
    session.signal(signalObj, function (error) {
      if (error) {
        logging.log(logging.logAction.signal, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.signal, logging.logVariation.success);
        resolve();
      }
    });
  });
};

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
var toggleLocalAudio = function toggleLocalAudio(enable) {
  logging.log(logging.logAction.toggleLocalAudio, logging.logVariation.attempt);

  var _internalState$getPub = internalState.getPubSub(),
      publishers = _internalState$getPub.publishers;

  var toggleAudio = function toggleAudio(id) {
    return communication.enableLocalAV(id, 'audio', enable);
  };
  Object.keys(publishers.camera).forEach(toggleAudio);
  logging.log(logging.logAction.toggleLocalAudio, logging.logVariation.success);
};

/**
 * Enable or disable local video
 * @param {Boolean} enable
 */
var toggleLocalVideo = function toggleLocalVideo(enable) {
  logging.log(logging.logAction.toggleLocalVideo, logging.logVariation.attempt);

  var _internalState$getPub2 = internalState.getPubSub(),
      publishers = _internalState$getPub2.publishers;

  var toggleVideo = function toggleVideo(id) {
    return communication.enableLocalAV(id, 'video', enable);
  };
  Object.keys(publishers.camera).forEach(toggleVideo);
  logging.log(logging.logAction.toggleLocalVideo, logging.logVariation.success);
};

/**
 * Enable or disable remote audio
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
var toggleRemoteAudio = function toggleRemoteAudio(id, enable) {
  logging.log(logging.logAction.toggleRemoteAudio, logging.logVariation.attempt);
  communication.enableRemoteAV(id, 'audio', enable);
  logging.log(logging.logAction.toggleRemoteAudio, logging.logVariation.success);
};

/**
 * Enable or disable remote video
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
var toggleRemoteVideo = function toggleRemoteVideo(id, enable) {
  logging.log(logging.logAction.toggleRemoteVideo, logging.logVariation.attempt);
  communication.enableRemoteAV(id, 'video', enable);
  logging.log(logging.logAction.toggleRemoteVideo, logging.logVariation.success);
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

  //init analytics
  logging.initLogAnalytics(window.location.origin, credentials.sessionId, null, credentials.apiKey);
  logging.log(logging.logAction.init, logging.logVariation.attempt);
  var session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  internalState.setSession(session);
  internalState.setCredentials(credentials);
  internalState.setOptions(options);
  logging.log(logging.logAction.init, logging.logVariation.success);
};

var opentokCore = {
  init: init,
  connect: connect,
  disconnect: disconnect,
  forceDisconnect: forceDisconnect,
  forceUnpublish: forceUnpublish,
  getAccPack: getAccPack,
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