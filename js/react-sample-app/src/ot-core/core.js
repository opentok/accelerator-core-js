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
var textChat = undefined;
var screenSharing = undefined;
var annotation = undefined;
var archiving = undefined;

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
var getSession = undefined;

/** Returns the current OpenTok session credentials */
var getCredentials = undefined;

/** Returns the options used for initialization */
var getOptions = undefined;

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
    var result = undefined;
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