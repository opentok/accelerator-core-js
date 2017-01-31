(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function _classCallCheck(n,e){if(!(n instanceof e))throw new TypeError("Cannot call a class as a function")}var _this=this,_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(n){return typeof n}:function(n){return n&&"function"==typeof Symbol&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},_createClass=function(){function n(n,e){for(var t=0;t<e.length;t++){var o=e[t];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(n,o.key,o)}}return function(e,t,o){return t&&n(e.prototype,t),o&&n(e,o),e}}();!function(){var n=function(n,e,t){var o="",r=void 0;t&&(r=new Date,r.setTime(r.getTime()+24*t*60*60*1e3),o=["; expires=",r.toGMTString()].join(""));var i=[n,"=",e,o,"; path=/"].join("");return document.cookie=i,e},e=function(n){for(var e=n+"=",t=document.cookie.split(";"),o=void 0,r=0;r<t.length;r++){for(o=t[r];" "===o.charAt(0);)o=o.substring(1,o.length);if(0===o.indexOf(e))return o.substring(e.length,o.length)}return null},t=function(){for(var n=[],e="0123456789abcdef",t=0;t<36;t++)n.push(e.substr(Math.floor(16*Math.random()),1));return n[14]="4",n[19]=e.substr(3&n[19]|8,1),n[8]=n[13]=n[18]=n[23]="-",n.join("")},o=function(o){return e(o)||n(o,t(),7)},r=function(n){if(!n.clientVersion)throw console.log("Error. The clientVersion field cannot be null in the log entry"),new Error("The clientVersion field cannot be null in the log entry");if(!n.source)throw console.log("Error. The source field cannot be null in the log entry"),new Error("The source field cannot be null in the log entry");if(!n.componentId)throw console.log("Error. The componentId field cannot be null in the log entry"),new Error("The componentId field cannot be null in the log entry");if(!n.name)throw console.log("Error. The name field cannot be null in the log entry"),new Error("The guid field cannot be null in the log entry");var e=n.logVersion||"2",t=n.clientSystemTime||(new Date).getTime();return Object.assign({},n,{logVersion:e,clientSystemTime:t})},i=function(n){var e=r(n),t="https://hlg.tokbox.com/prod/logging/ClientEvent",o=new XMLHttpRequest;o.open("POST",t,!0),o.setRequestHeader("Content-type","application/json"),o.send(JSON.stringify(e))},l=function(){function n(e){_classCallCheck(this,n),this.analyticsData=e,this.analyticsData.guid=o(e.name)}return _createClass(n,[{key:"addSessionInfo",value:function(n){if(!n.sessionId)throw console.log("Error. The sessionId field cannot be null in the log entry"),new Error("The sessionId field cannot be null in the log entry");if(this.analyticsData.sessionId=n.sessionId,!n.connectionId)throw console.log("Error. The connectionId field cannot be null in the log entry"),new Error("The connectionId field cannot be null in the log entry");if(this.analyticsData.connectionId=n.connectionId,0===n.partnerId)throw console.log("Error. The partnerId field cannot be null in the log entry"),new Error("The partnerId field cannot be null in the log entry");this.analyticsData.partnerId=n.partnerId}},{key:"logEvent",value:function(n){this.analyticsData.action=n.action,this.analyticsData.variation=n.variation,this.analyticsData.clientSystemTime=(new Date).getTime(),i(this.analyticsData)}}]),n}();"object"===("undefined"==typeof exports?"undefined":_typeof(exports))?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):_this.OTKAnalytics=l}(this);
},{}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* global OT */

/** Dependencies */
var logging = require('./logging');
var state = require('./state');

var _require = require('./util'),
    dom = _require.dom,
    path = _require.path,
    properCase = _require.properCase;

var session = void 0;
var accPack = void 0;
var callProperties = void 0;
var screenProperties = void 0;
var streamContainers = void 0;
var autoSubscribe = void 0;
var connectionLimit = void 0;
var active = false;

/**
 * Default UI propties
 * https://tokbox.com/developer/guides/customize-ui/js/
 */
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
 * Trigger an event through the API layer
 * @param {String} event - The name of the event
 * @param {*} [data]
 */
var triggerEvent = function triggerEvent(event, data) {
  return accPack.triggerEvent(event, data);
};

/**
 * Determine whether or not the party is able to join the call based on
 * the specified connection limit, if any.
 * @return {Boolean}
 */
var ableToJoin = function ableToJoin() {
  if (!connectionLimit) {
    return true;
  }
  var cameraStreams = Object.values(state.getStreams()).filter(function (s) {
    return s.videoType === 'camera';
  });
  return cameraStreams.length < connectionLimit;
};

/**
 * Create a camera publisher object
 * @returns {Promise} <resolve: Object, reject: Error>
 */
var createPublisher = function createPublisher() {
  return new Promise(function (resolve, reject) {
    // TODO: Handle adding 'name' option to props
    var props = Object.assign({}, callProperties);
    // TODO: Figure out how to handle common vs package-specific options
    var container = dom.element(streamContainers('publisher', 'camera'));
    var publisher = OT.initPublisher(container, props, function (error) {
      error ? reject(error) : resolve(publisher);
    });
  });
};

/**
 * Publish the local camera stream and update state
 * @returns {Promise} <resolve: empty, reject: Error>
 */
var publish = function publish() {
  return new Promise(function (resolve, reject) {
    var onPublish = function onPublish(publisher) {
      return function (error) {
        if (error) {
          reject(error);
          logging.log(logging.logAction.startCall, logging.logVariation.fail);
        } else {
          logging.log(logging.logAction.startCall, logging.logVariation.success);
          state.addPublisher('camera', publisher);
          resolve(publisher);
        }
      };
    };

    var publishToSession = function publishToSession(publisher) {
      return session.publish(publisher, onPublish(publisher));
    };

    var handleError = function handleError(error) {
      logging.log(logging.logAction.startCall, logging.logVariation.fail);
      var errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
      triggerEvent('error', errorMessage);
      reject(error);
    };

    createPublisher().then(publishToSession).catch(handleError);
  });
};

/**
 * Subscribe to a stream and update the state
 * @param {Object} stream - An OpenTok stream object
 * @returns {Promise} <resolve: empty reject: Error >
 */
var subscribe = function subscribe(stream) {
  return new Promise(function (resolve, reject) {
    logging.log(logging.logAction.subscribe, logging.logVariation.attempt);
    var streamMap = state.getStreamMap();
    if (streamMap[stream.id]) {
      // Are we already subscribing to the stream?
      resolve();
    } else {
      (function () {
        var type = stream.videoType;
        var connectionData = JSON.parse(path(['connection', 'data'], stream) || null);
        var container = dom.query(streamContainers('subscriber', type, connectionData));
        var options = type === 'camera' ? callProperties : screenProperties;
        var subscriber = session.subscribe(stream, container, options, function (error) {
          if (error) {
            logging.log(logging.logAction.subscribe, logging.logVariation.fail);
            reject(error);
          } else {
            state.addSubscriber(subscriber);
            triggerEvent('subscribeTo' + properCase(type), Object.assign({}, { subscriber: subscriber }, state.all()));
            type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
            logging.log(logging.logAction.subscribe, logging.logVariation.success);
            resolve();
          }
        });
      })();
    }
  });
};

/**
 * Unsubscribe from a stream and update the state
 * @param {Object} subscriber - An OpenTok subscriber object
 * @returns {Promise} <resolve: empty>
 */
var unsubscribe = function unsubscribe(subscriber) {
  return new Promise(function (resolve) {
    logging.log(logging.logAction.unsubscribe, logging.logVariation.attempt);
    var type = path('stream.videoType', subscriber);
    state.removeSubscriber(type, subscriber);
    session.unsubscribe(subscriber);
    logging.log(logging.logAction.unsubscribe, logging.logVariation.success);
    resolve();
  });
};

/**
 * Ensure all required options are received
 * @param {Object} options
 */
var validateOptions = function validateOptions(options) {
  var requiredOptions = ['session', 'publishers', 'subscribers', 'streams', 'accPack'];

  requiredOptions.forEach(function (option) {
    if (!options[option]) {
      logging.error(option + ' is a required option.');
    }
  });

  session = options.session;
  accPack = options.accPack;
  streamContainers = options.streamContainers;
  callProperties = options.callProperties || defaultCallProperties;
  connectionLimit = options.connectionLimit || null;
  autoSubscribe = options.hasOwnProperty('autoSubscribe') ? options.autoSubscribe : true;

  screenProperties = options.screenProperties || Object.assign({}, defaultCallProperties, { videoSource: 'window' });
};

/**
 * Subscribe to new stream unless autoSubscribe is set to false
 * @param {Object} stream
 */
var onStreamCreated = function onStreamCreated(_ref) {
  var stream = _ref.stream;
  return active && autoSubscribe && subscribe(stream);
};

/**
 * Update state and trigger corresponding event(s) when stream is destroyed
 * @param {Object} stream
 */
var onStreamDestroyed = function onStreamDestroyed(_ref2) {
  var stream = _ref2.stream;

  state.removeStream(stream);
  var type = stream.videoType;
  type === 'screen' && triggerEvent('endViewingSharedScreen'); // Legacy event
  triggerEvent('unsubscribeFrom' + properCase(type), state.getPubSub());
};

/**
 * Listen for API-level events
 */
var createEventListeners = function createEventListeners() {
  accPack.on('streamCreated', onStreamCreated);
  accPack.on('streamDestroyed', onStreamDestroyed);
};

/**
 * Start publishing the local camera feed and subscribing to streams in the session
 * @returns {Promise} <resolve: Object, reject: Error>
 */
var startCall = function startCall() {
  return new Promise(function (resolve, reject) {
    // eslint-disable-line consistent-return
    logging.log(logging.logAction.startCall, logging.logVariation.attempt);

    /**
     * Determine if we're able to join the session based on an existing connection limit
     */
    if (!ableToJoin()) {
      var errorMessage = 'Session has reached its connection limit';
      triggerEvent('error', errorMessage);
      logging.log(logging.logAction.startCall, logging.logVariation.fail);
      return reject(new Error(errorMessage));
    }

    /**
     * Subscribe to any streams that existed before we start the call from our side.
     */
    var subscribeToInitialStreams = function subscribeToInitialStreams(publisher) {
      // Get an array of initial subscription promises
      var initialSubscriptions = function initialSubscriptions() {
        if (autoSubscribe) {
          var _ret2 = function () {
            var streams = state.getStreams();
            return {
              v: Object.keys(streams).map(function (id) {
                return subscribe(streams[id]);
              })
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        }
        return [Promise.resolve()];
      };

      // Handle success
      var onSubscribeToAll = function onSubscribeToAll() {
        var pubSubData = Object.assign({}, state.getPubSub(), { publisher: publisher });
        triggerEvent('startCall', pubSubData);
        active = true;
        resolve(pubSubData);
      };

      // Handle error
      var onError = function onError(reason) {
        logging.message('Failed to subscribe to all existing streams: ' + reason);
        // We do not reject here in case we still successfully publish to the session
        resolve(Object.assign({}, state.getPubSub(), { publisher: publisher }));
      };

      Promise.all(initialSubscriptions()).then(onSubscribeToAll).catch(onError);
    };

    publish().then(subscribeToInitialStreams).catch(reject);
  });
};

/**
 * Stop publishing and unsubscribe from all streams
 */
var endCall = function endCall() {
  logging.log(logging.logAction.endCall, logging.logVariation.attempt);

  var _state$getPubSub = state.getPubSub(),
      publishers = _state$getPubSub.publishers,
      subscribers = _state$getPubSub.subscribers;

  var unpublish = function unpublish(publisher) {
    return session.unpublish(publisher);
  };
  Object.values(publishers.camera).forEach(unpublish);
  Object.values(publishers.screen).forEach(unpublish);
  // TODO Promise.all for unsubsribing
  Object.values(subscribers.camera).forEach(unsubscribe);
  Object.values(subscribers.screen).forEach(unsubscribe);
  state.removeAllPublishers();
  active = false;
  logging.log(logging.logAction.endCall, logging.logVariation.success);
};

/**
 * Enable/disable local audio or video
 * @param {String} source - 'audio' or 'video'
 * @param {Boolean} enable
 */
var enableLocalAV = function enableLocalAV(id, source, enable) {
  var method = 'publish' + properCase(source);

  var _state$getPubSub2 = state.getPubSub(),
      publishers = _state$getPubSub2.publishers;

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

  var _state$getPubSub3 = state.getPubSub(),
      subscribers = _state$getPubSub3.subscribers;

  subscribers.camera[subscriberId][method](enable);
};

/**
 * Initialize the communication component
 * @param {Object} options
 * @param {Object} options.session
 * @param {Object} options.publishers
 * @param {Object} options.subscribers
 * @param {Object} options.streams
 * @param {Number} options.connectionLimit
 * @param {Function} options.streamContainer
 */
var init = function init(options) {
  return new Promise(function (resolve) {
    validateOptions(options);
    createEventListeners();
    resolve();
  });
};

/** Exports */
module.exports = {
  init: init,
  startCall: startCall,
  endCall: endCall,
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  enableLocalAV: enableLocalAV,
  enableRemoteAV: enableRemoteAV
};

},{"./logging":5,"./state":6,"./util":7}],3:[function(require,module,exports){
(function (global){
'use strict';

var _arguments = arguments;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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


var textChat = void 0; // eslint-disable-line no-unused-vars
var screenSharing = void 0; // eslint-disable-line no-unused-vars
var annotation = void 0;
var archiving = void 0; // eslint-disable-line no-unused-vars

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
    //logging.log(logging.logAction.on, logging.logVariation.fail);
  } else {
    eventCallbacks.add(callback);
    //logging.log(logging.logAction.on, logging.logVariation.success);
  }
};

/**
 * Remove a callback for a specific event.  If no parameters are passed,
 * all event listeners will be removed.
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
var off = function off(event, callback) {
  //logging.log(logging.logAction.off, logging.logVariation.attempt);
  if (_arguments.lenth === 0) {
    Object.keys(eventListeners).forEach(function (eventType) {
      eventListeners[eventType].clear();
    });
  }
  var eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    //logging.log(logging.logAction.off, logging.logVariation.fail);
    logging.message(event + ' is not a registered event.');
  } else {
    eventCallbacks.delete(callback);
    //logging.log(logging.logAction.off, logging.logVariation.success);
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
    var result = void 0;
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
    var screenSharingOptions = packageName === 'screenSharing' ? Object.assign({}, options.screenSharing, { screenSharingContainer: containers.stream }) : {};
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

  logging.log(logging.logAction.initPackages, logging.logVariation.success);
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
    logging.log(logging.logAction.connect, logging.logVariation.attempt);
    var session = getSession();

    var _getCredentials = getCredentials(),
        token = _getCredentials.token;

    session.connect(token, function (error) {
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./communication":2,"./events":4,"./logging":5,"./state":6,"./util":7,"opentok-annotation":undefined,"opentok-archiving":undefined,"opentok-screen-sharing":undefined,"opentok-text-chat":undefined}],4:[function(require,module,exports){
'use strict';

var events = {
  session: ['archiveStarted', 'archiveStopped', 'connectionCreated', 'connectionDestroyed', 'sessionConnected', 'sessionDisconnected', 'sessionReconnected', 'sessionReconnecting', 'signal', 'streamCreated', 'streamDestroyed', 'streamPropertyChanged'],
  core: ['connected', 'startScreenShare', 'endScreenShare', 'error'],
  communication: ['startCall', 'endCall', 'callPropertyChanged', 'subscribeToCamera', 'subscribeToScreen', 'unsubscribeFromCamera', 'unsubscribeFromScreen', 'startViewingSharedScreen', 'endViewingSharedScreen'],
  textChat: ['showTextChat', 'hideTextChat', 'messageSent', 'errorSendingMessage', 'messageReceived'],
  screenSharing: ['startScreenSharing', 'endScreenSharing', 'screenSharingError'],
  annotation: ['startAnnotation', 'linkAnnotation', 'resizeCanvas', 'annotationWindowClosed', 'endAnnotation'],
  archiving: ['startArchive', 'stopArchive', 'archiveReady', 'archiveError']
};

module.exports = events;

},{}],5:[function(require,module,exports){
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

},{"opentok-solutions-logging":1}],6:[function(require,module,exports){
'use strict';

/**
 * Internal variables
 */

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

var session = null;
var credentials = null;
var options = null;

/**
 * Internal methods
 */

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
  /* eslint-disable no-param-reassign */
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
  /* eslint-enable no-param-reassign */
  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 * @returns {Object}
 */
var getPubSub = function getPubSub() {
  return { publishers: publishers, subscribers: subscribers, meta: pubSubCount() };
};

/**
 * Get streams, streamMap, publishers, and subscribers
 * @return {Object}
 */
var all = function all() {
  return Object.assign({}, { streams: streams, streamMap: streamMap }, getPubSub());
};

/**
 * Get the current OpenTok session
 * @returns {Object}
 */
var getSession = function getSession() {
  return session;
};

/**
 * Set the current OpenTok session
 * @param {Object} otSession
 */
var setSession = function setSession(otSession) {
  session = otSession;
};

/**
 * Get the current OpenTok credentials
 * @returns {Object}
 */
var getCredentials = function getCredentials() {
  return credentials;
};

/**
 * Set the current OpenTok credentials
 * @param {Object} otCredentials
 */
var setCredentials = function setCredentials(otCredentials) {
  credentials = otCredentials;
};

/**
 * Get the options defined for core
 * @returns {Object}
 */
var getOptions = function getOptions() {
  return options;
};

/**
 * Set the options defined for core
 * @param {Object} otOptions
 */
var setOptions = function setOptions(otOptions) {
  options = otOptions;
};

/**
 * Add a stream to state
 * @param {Object} stream - An OpenTok stream object
 */
var addStream = function addStream(stream) {
  streams[stream.id] = stream;
};

/**
 * Remove a stream from state and any associated subscribers
 * @param {Object} stream - An OpenTok stream object
 */
var removeStream = function removeStream(stream) {
  var type = stream.videoType;
  var subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};

/**
 * Get all remote streams
 * @returns {Object}
 */
var getStreams = function getStreams() {
  return streams;
};

/**
 * Get the map of stream ids to publisher/subscriber ids
 * @returns {Object}
 */
var getStreamMap = function getStreamMap() {
  return streamMap;
};

/**
 * Add a publisher to state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} publisher - The OpenTok publisher object
 */
var addPublisher = function addPublisher(type, publisher) {
  streamMap[publisher.streamId] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

/**
 * Remove a publisher from state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} publisher - The OpenTok publisher object
 */
var removePublisher = function removePublisher(type, publisher) {
  var id = publisher.id || streamMap[publisher.streamId];
  delete publishers[type][id];
  delete streamMap[publisher.streamId];
};

/**
 * Remove all publishers from state
 */
var removeAllPublishers = function removeAllPublishers() {
  ['camera', 'screen'].forEach(function (type) {
    Object.values(publishers[type]).forEach(function (publisher) {
      removePublisher(type, publisher);
    });
  });
};

/**
 * Add a subscriber to state
 * @param {Object} - An OpenTok subscriber object
 */
var addSubscriber = function addSubscriber(subscriber) {
  var type = subscriber.stream.videoType;
  var streamId = subscriber.stream.id;
  subscribers[type][subscriber.id] = subscriber;
  streamMap[streamId] = subscriber.id;
};

/**
 * Remove a publisher from state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} subscriber - The OpenTok subscriber object
 */
var removeSubscriber = function removeSubscriber(type, subscriber) {
  var id = subscriber.id || streamMap[subscriber.streamId];
  delete subscribers[type][id];
  delete streamMap[subscriber.streamId];
};

/**
 * Remove all subscribers from state
 */
var removeAllSubscribers = function removeAllSubscribers() {
  ['camera', 'screen'].forEach(function (type) {
    Object.values(subscribers[type]).forEach(function (subscriber) {
      removeSubscriber(type, subscriber);
    });
  });
};

/**
 * Reset state
 */
var reset = function reset() {
  removeAllPublishers();
  removeAllSubscribers();
  [streams, streamMap].forEach(function (streamObj) {
    Object.keys(streamObj).forEach(function (streamId) {
      delete streamObj[streamId]; // eslint-disable-line no-param-reassign
    });
  });
};

/** Exports */
module.exports = {
  all: all,
  getSession: getSession,
  setSession: setSession,
  getCredentials: getCredentials,
  setCredentials: setCredentials,
  getOptions: getOptions,
  setOptions: setOptions,
  addStream: addStream,
  removeStream: removeStream,
  getStreams: getStreams,
  getStreamMap: getStreamMap,
  addPublisher: addPublisher,
  removePublisher: removePublisher,
  removeAllPublishers: removeAllPublishers,
  addSubscriber: addSubscriber,
  removeSubscriber: removeSubscriber,
  removeAllSubscribers: removeAllSubscribers,
  getPubSub: getPubSub,
  reset: reset
};

},{}],7:[function(require,module,exports){
'use strict';

/** Wrap DOM selector methods:
 *  document.querySelector,
 *  document.getElementById,
 *  document.getElementsByClassName
 *  'element' checks for a string before returning an element with `query`
 */
var dom = {
  query: function query(arg) {
    return document.querySelector(arg);
  },
  id: function id(arg) {
    return document.getElementById(arg);
  },
  class: function _class(arg) {
    return document.getElementsByClassName(arg);
  },
  element: function element(el) {
    return typeof el === 'string' ? this.query(el) : el;
  }
};

/**
 * Returns a (nested) propery from an object, or undefined if it doesn't exist
 * @param {String | Array} props - An array of properties or a single property
 * @param {Object | Array} obj
 */
var path = function path(props, obj) {
  var nested = obj;
  var properties = typeof props === 'string' ? props.split('.') : props;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = properties[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var property = _step.value;

      nested = nested[property];
      if (nested === undefined) {
        return nested;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return nested;
};

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param {String} text
 * @returns {String}
 */
var properCase = function properCase(text) {
  return '' + text[0].toUpperCase() + text.slice(1);
};

module.exports = {
  dom: dom,
  path: path,
  properCase: properCase
};

},{}]},{},[3]);
