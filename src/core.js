/* global OT */
/**
 * Dependencies
 */
require('babel-polyfill');
const util = require('./util');
const internalState = require('./state');
const accPackEvents = require('./events');
const communication = require('./communication');
const OpenTokSDK = require('./sdk-wrapper/sdkWrapper');
const { CoreError } = require('./errors');
const {
  message,
  initLogAnalytics,
  logAnalytics,
  logAction,
  logVariation,
  updateLogAnalytics,
} = require('./logging');

/**
 * Helper methods
 */
const { dom, path, pathOr, properCase } = util;

/**
 * Individual Accelerator Packs
 */
let textChat; // eslint-disable-line no-unused-vars
let screenSharing; // eslint-disable-line no-unused-vars
let annotation;
let archiving; // eslint-disable-line no-unused-vars

/**
 * Get access to an accelerator pack
 * @param {String} packageName - textChat, screenSharing, annotation, or archiving
 * @returns {Object} The instance of the accelerator pack
 */
const getAccPack = (packageName) => {
  logAnalytics(logAction.getAccPack, logVariation.attempt);
  const packages = {
    textChat,
    screenSharing,
    annotation,
    archiving,
  };
  logAnalytics(logAction.getAccPack, logVariation.success);
  return packages[packageName];
};

/** Eventing */

const eventListeners = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 */
const registerEvents = (events) => {
  const eventList = Array.isArray(events) ? events : [events];
  eventList.forEach((event) => {
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
const on = (event, callback) => {
  // logAnalytics(logAction.on, logVariation.attempt);
  if (typeof event === 'object') {
    Object.keys(event).forEach((eventName) => {
      on(eventName, event[eventName]);
    });
    return;
  }
  const eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    message(`${event} is not a registered event.`);
    // logAnalytics(logAction.on, logVariation.fail);
  } else {
    eventCallbacks.add(callback);
    // logAnalytics(logAction.on, logVariation.success);
  }
};

/**
 * Remove a callback for a specific event.  If no parameters are passed,
 * all event listeners will be removed.
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
const off = (event, callback) => {
  // logAnalytics(logAction.off, logVariation.attempt);
  if (!event && !callback) {
    Object.keys(eventListeners).forEach((eventType) => {
      eventListeners[eventType].clear();
    });
  } else {
    const eventCallbacks = eventListeners[event];
    if (!eventCallbacks) {
      // logAnalytics(logAction.off, logVariation.fail);
      message(`${event} is not a registered event.`);
    } else {
      eventCallbacks.delete(callback);
      // logAnalytics(logAction.off, logVariation.success);
    }
  }
};

/**
 * Trigger an event and fire all registered callbacks
 * @param {String} event - The name of the event
 * @param {*} data - Data to be passed to callback functions
 */
const triggerEvent = (event, data) => {
  const eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    registerEvents(event);
    message(`${event} has been registered as a new event.`);
  } else {
    eventCallbacks.forEach(callback => callback(data, event));
  }
};

/**
 * Get the current OpenTok session object
 * @returns {Object}
 */
const getSession = internalState.getSession;


/**
 * Returns the current OpenTok session credentials
 * @returns {Object}
 */
const getCredentials = internalState.getCredentials;

/**
 * Returns the options used for initialization
 * @returns {Object}
 */
const getOptions = internalState.getOptions;

const createEventListeners = (session, options) => {
  Object.keys(accPackEvents).forEach(type => registerEvents(accPackEvents[type]));

  /**
   * If using screen sharing + annotation in an external window, the screen sharing
   * package will take care of calling annotation.start() and annotation.linkCanvas()
   */
  const usingAnnotation = path('screenSharing.annotation', options);
  const internalAnnotation = usingAnnotation && !path('screenSharing.externalWindow', options);

  /**
   * Wrap session events and update internalState when streams are created
   * or destroyed
   */
  accPackEvents.session.forEach((eventName) => {
    session.on(eventName, (event) => {
      if (eventName === 'streamCreated') { internalState.addStream(event.stream); }
      if (eventName === 'streamDestroyed') { internalState.removeStream(event.stream); }
      triggerEvent(eventName, event);
    });
  });

  if (usingAnnotation) {
    on('subscribeToScreen', ({ subscriber }) => {
      annotation.start(getSession())
        .then(() => {
          const absoluteParent = dom.query(path('annotation.absoluteParent.subscriber', options));
          const linkOptions = absoluteParent ? { absoluteParent } : null;
          annotation.linkCanvas(subscriber, subscriber.element.parentElement, linkOptions);
        });
    });

    on('unsubscribeFromScreen', () => {
      annotation.end();
    });
  }

  on('startScreenSharing', (publisher) => {
    internalState.addPublisher('screen', publisher);
    triggerEvent('startScreenShare', Object.assign({}, { publisher }, internalState.getPubSub()));
    if (internalAnnotation) {
      annotation.start(getSession())
        .then(() => {
          const absoluteParent = dom.query(path('annotation.absoluteParent.publisher', options));
          const linkOptions = absoluteParent ? { absoluteParent } : null;
          annotation.linkCanvas(publisher, publisher.element.parentElement, linkOptions);
        });
    }
  });

  on('endScreenSharing', (publisher) => {
    // delete publishers.screen[publisher.id];
    internalState.removePublisher('screen', publisher);
    triggerEvent('endScreenShare', internalState.getPubSub());
    if (internalAnnotation) {
      annotation.end();
    }
  });
};

const setupExternalAnnotation = () =>
  annotation.start(getSession(), {
    screensharing: true,
  });

const linkAnnotation = (pubSub, annotationContainer, externalWindow) => {
  annotation.linkCanvas(pubSub, annotationContainer, {
    externalWindow,
  });

  if (externalWindow) {
    // Add subscribers to the external window
    const streams = internalState.getStreams();
    const cameraStreams = Object.keys(streams).reduce((acc, streamId) => {
      const stream = streams[streamId];
      return stream.videoType === 'camera' ? acc.concat(stream) : acc;
    }, []);
    cameraStreams.forEach(annotation.addSubscriberToExternalWindow);
  }
};

const initPackages = () => {
  logAnalytics(logAction.initPackages, logVariation.attempt);
  const session = getSession();
  const options = getOptions();
  /**
   * Try to require a package.  If 'require' is unavailable, look for
   * the package in global scope.  A switch ttatement is used because
   * webpack and Browserify aren't able to resolve require statements
   * that use variable names.
   * @param {String} packageName - The name of the npm package
   * @param {String} globalName - The name of the package if exposed on global/window
   * @returns {Object}
   */
  const optionalRequire = (packageName, globalName) => {
    let result;
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
      logAnalytics(logAction.initPackages, logVariation.fail);
      throw new CoreError(`Could not load ${packageName}`, 'missingDependency');
    }
    return result;
  };

  const availablePackages = {
    textChat() {
      return optionalRequire('opentok-text-chat', 'TextChatAccPack');
    },
    screenSharing() {
      return optionalRequire('opentok-screen-sharing', 'ScreenSharingAccPack');
    },
    annotation() {
      return optionalRequire('opentok-annotation', 'AnnotationAccPack');
    },
    archiving() {
      return optionalRequire('opentok-archiving', 'ArchivingAccPack');
    },
  };

  const packages = {};
  (path('packages', options) || []).forEach((acceleratorPack) => {
    if (availablePackages[acceleratorPack]) { // eslint-disable-next-line no-param-reassign
      packages[properCase(acceleratorPack)] = availablePackages[acceleratorPack]();
    } else {
      message(`${acceleratorPack} is not a valid accelerator pack`);
    }
  });

  /**
   * Get containers for streams, controls, and the chat widget
   */
  const getDefaultContainer = pubSub => document.getElementById(`${pubSub}Container`);
  const getContainerElements = () => {
    // Need to use path to check for null values
    const controls = pathOr('#videoControls', 'controlsContainer', options);
    const chat = pathOr('#chat', 'textChat.container', options);
    const stream = pathOr(getDefaultContainer, 'streamContainers', options);
    return { stream, controls, chat };
  };
  /** *** *** *** *** */


  /**
   * Return options for the specified package
   * @param {String} packageName
   * @returns {Object}
   */
  const packageOptions = (packageName) => {
    /**
     * Methods to expose to accelerator packs
     */
    const accPack = {
      registerEventListener: on, // Legacy option
      on,
      registerEvents,
      triggerEvent,
      setupExternalAnnotation,
      linkAnnotation,
    };

    /**
     * If options.controlsContainer/containers.controls is null,
     * accelerator packs should not append their controls.
     */
    const containers = getContainerElements();
    const appendControl = !!containers.controls;
    const controlsContainer = containers.controls; // Legacy option
    const streamContainers = containers.stream;
    const baseOptions = { session, accPack, controlsContainer, appendControl, streamContainers };

    switch (packageName) {
      /* beautify ignore:start */
      case 'communication': {
        return Object.assign({}, baseOptions, options.communication);
      }
      case 'textChat': {
        const textChatOptions = {
          textChatContainer: path('textChat.container', options),
          waitingMessage: path('textChat.waitingMessage', options),
          sender: { alias: path('textChat.name', options) },
          alwaysOpen: path('textChat.alwaysOpen', options),
        };
        return Object.assign({}, baseOptions, textChatOptions);
      }
      case 'screenSharing': {
        const screenSharingContainer = { screenSharingContainer: streamContainers };
        return Object.assign({}, baseOptions, screenSharingContainer, options.screenSharing);
      }
      case 'annotation': {
        return Object.assign({}, baseOptions, options.annotation);
      }
      case 'archiving': {
        return Object.assign({}, baseOptions, options.archiving);
      }
      default:
        return {};
      /* beautify ignore:end */
    }
  };

  /** Create instances of each package */
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  communication.init(packageOptions('communication'));
  textChat = packages.TextChat ? new packages.TextChat(packageOptions('textChat')) : null;
  screenSharing = packages.ScreenSharing ? new packages.ScreenSharing(packageOptions('screenSharing')) : null;
  annotation = packages.Annotation ? new packages.Annotation(packageOptions('annotation')) : null;
  archiving = packages.Archiving ? new packages.Archiving(packageOptions('archiving')) : null;

  logAnalytics(logAction.initPackages, logVariation.success);
};


/**
 * Ensures that we have the required credentials
 * @param {Object} credentials
 * @param {String} credentials.apiKey
 * @param {String} credentials.sessionId
 * @param {String} credentials.token
 */
const validateCredentials = (credentials = []) => {
  const required = ['apiKey', 'sessionId', 'token'];
  required.forEach((credential) => {
    if (!credentials[credential]) {
      throw new CoreError(`${credential} is a required credential`, 'invalidParameters');
    }
  });
};

/**
 * Connect to the session
 * @returns {Promise} <resolve: -, reject: Error>
 */
const connect = () =>
  new Promise((resolve, reject) => {
    logAnalytics(logAction.connect, logVariation.attempt);
    const session = getSession();
    const { token } = getCredentials();
    session.connect(token, (error) => {
      if (error) {
        message(error);
        logAnalytics(logAction.connect, logVariation.fail);
        return reject(error);
      }
      const { sessionId, apiKey } = session;
      updateLogAnalytics(sessionId, path('connection.connectionId', session), apiKey);
      logAnalytics(logAction.connect, logVariation.success);
      initPackages();
      triggerEvent('connected', session);
      return resolve({ connections: session.connections.length() });
    });
  });

/**
 * Disconnect from the session
 * @returns {Promise} <resolve: -, reject: Error>
 */
const disconnect = () => {
  logAnalytics(logAction.disconnect, logVariation.attempt);
  getSession().disconnect();
  internalState.reset();
  logAnalytics(logAction.disconnect, logVariation.success);
};


/**
 * Force a remote connection to leave the session
 * @param {Object} connection
 * @returns {Promise} <resolve: empty, reject: Error>
 */
const forceDisconnect = connection =>
  new Promise((resolve, reject) => {
    logAnalytics(logAction.forceDisconnect, logVariation.attempt);
    getSession().forceDisconnect(connection, (error) => {
      if (error) {
        logAnalytics(logAction.forceDisconnect, logVariation.fail);
        reject(error);
      } else {
        logAnalytics(logAction.forceDisconnect, logVariation.success);
        resolve();
      }
    });
  });


/**
 * Force the publisher of a stream to stop publishing the stream
 * @param {Object} stream
 * @returns {Promise} <resolve: empty, reject: Error>
 */
const forceUnpublish = stream =>
  new Promise((resolve, reject) => {
    logAnalytics(logAction.forceUnpublish, logVariation.attempt);
    getSession().forceUnpublish(stream, (error) => {
      if (error) {
        logAnalytics(logAction.forceUnpublish, logVariation.fail);
        reject(error);
      } else {
        logAnalytics(logAction.forceUnpublish, logVariation.success);
        resolve();
      }
    });
  });

/**
 * Get the local publisher object for a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Object} - The publisher object
 */
const getPublisherForStream = stream => getSession().getPublisherForStream(stream);

/**
 * Get the local subscriber objects for a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Array} - An array of subscriber object
 */
const getSubscribersForStream = stream => getSession().getSubscribersForStream(stream);


/**
 * Send a signal using the OpenTok signaling apiKey
 * @param {String} type
 * @param {*} [data]
 * @param {Object} [to] - An OpenTok connection object
 * @returns {Promise} <resolve: empty, reject: Error>
 */
const signal = (type, data, to) =>
  new Promise((resolve, reject) => {
    logAnalytics(logAction.signal, logVariation.attempt);
    const session = getSession();
    const signalObj = Object.assign({},
      type ? { type } : null,
      data ? { data: JSON.stringify(data) } : null,
      to ? { to } : null // eslint-disable-line comma-dangle
    );
    session.signal(signalObj, (error) => {
      if (error) {
        logAnalytics(logAction.signal, logVariation.fail);
        reject(error);
      } else {
        logAnalytics(logAction.signal, logVariation.success);
        resolve();
      }
    });
  });

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
const toggleLocalAudio = (enable) => {
  logAnalytics(logAction.toggleLocalAudio, logVariation.attempt);
  const { publishers } = internalState.getPubSub();
  const toggleAudio = id => communication.enableLocalAV(id, 'audio', enable);
  Object.keys(publishers.camera).forEach(toggleAudio);
  logAnalytics(logAction.toggleLocalAudio, logVariation.success);
};

/**
 * Enable or disable local video
 * @param {Boolean} enable
 */
const toggleLocalVideo = (enable) => {
  logAnalytics(logAction.toggleLocalVideo, logVariation.attempt);
  const { publishers } = internalState.getPubSub();
  const toggleVideo = id => communication.enableLocalAV(id, 'video', enable);
  Object.keys(publishers.camera).forEach(toggleVideo);
  logAnalytics(logAction.toggleLocalVideo, logVariation.success);
};

/**
 * Enable or disable remote audio
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
const toggleRemoteAudio = (id, enable) => {
  logAnalytics(logAction.toggleRemoteAudio, logVariation.attempt);
  communication.enableRemoteAV(id, 'audio', enable);
  logAnalytics(logAction.toggleRemoteAudio, logVariation.success);
};

/**
 * Enable or disable remote video
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
const toggleRemoteVideo = (id, enable) => {
  logAnalytics(logAction.toggleRemoteVideo, logVariation.attempt);
  communication.enableRemoteAV(id, 'video', enable);
  logAnalytics(logAction.toggleRemoteVideo, logVariation.success);
};

/**
 * Initialize the accelerator pack
 * @param {Object} options
 * @param {Object} options.credentials
 * @param {Array} [options.packages]
 * @param {Object} [options.containers]
 */
const init = (options) => {
  if (!options) {
    throw new CoreError('Missing options required for initialization', 'invalidParameters');
  }
  const { credentials } = options;
  validateCredentials(options.credentials);

  // Init analytics
  initLogAnalytics(window.location.origin, credentials.sessionId, null, credentials.apiKey);
  logAnalytics(logAction.init, logVariation.attempt);
  const session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  internalState.setSession(session);
  internalState.setCredentials(credentials);
  internalState.setOptions(options);
  logAnalytics(logAction.init, logVariation.success);
};

const opentokCore = {
  init,
  connect,
  disconnect,
  forceDisconnect,
  forceUnpublish,
  getAccPack,
  getOptions,
  getSession,
  getPublisherForStream,
  getSubscribersForStream,
  on,
  off,
  registerEventListener: on,
  triggerEvent,
  signal,
  state: internalState.all,
  startCall: communication.startCall,
  endCall: communication.endCall,
  OpenTokSDK,
  toggleLocalAudio,
  toggleLocalVideo,
  toggleRemoteAudio,
  toggleRemoteVideo,
  subscribe: communication.subscribe,
  unsubscribe: communication.unsubscribe,
  util,
};

if (global === window) {
  window.otCore = opentokCore;
}

module.exports = opentokCore;
