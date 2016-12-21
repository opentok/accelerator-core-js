/* global OT */
/**
 * Dependencies
 */
const logging = require('./logging');
const communication = require('./communication');
const accPackEvents = require('./events');
const internalState = require('./state');
const { dom, path, properCase } = require('./util');

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
  logging.log(logging.logAction.getAccPack, logging.logVariation.attempt);
  const packages = {
    textChat,
    screenSharing,
    annotation,
    archiving,
  };
  logging.log(logging.logAction.getAccPack, logging.logVariation.success);
  return packages[packageName];
};

/** Eventing */

const eventListeners = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 * @returns {function} See triggerEvent
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
  //logging.log(logging.logAction.on, logging.logVariation.attempt);
  if (typeof event === 'object') {
    Object.keys(event).forEach((eventName) => {
      on(eventName, event[eventName]);
    });
  }
  const eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    logging.message(`${event} is not a registered event.`);
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
const off = (event, callback) => {
  // logging.log(logging.logAction.off, logging.logVariation.attempt);
  if (arguments.lenth === 0) {
    Object.keys(eventListeners).forEach((eventType) => {
      eventListeners[eventType].clear();
    });
  }
  const eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    // logging.log(logging.logAction.off, logging.logVariation.fail);
    logging.message(`${event} is not a registered event.`);
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
const triggerEvent = (event, data) => {
  const eventCallbacks = eventListeners[event];
  if (!eventCallbacks) {
    registerEvents(event);
    logging.message(`${event} has been registered as a new event.`);
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
   * If using screen sharing + annotation in an external window, the individual packages
   * will take care of
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
  //logging.log(logging.logAction.initPackages, logging.logVariation.attempt);
  const session = getSession();
  const options = getOptions();
  /**
   * Try to require a package.  If 'require' is unavailable, look for
   * the package in global scope.  A switch internalStatement is used because
   * webpack and Browserify aren't able to resolve require internalStatements
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
      //logging.log(logging.logAction.initPackages, logging.logVariation.fail);
      logging.error(`Could not load ${packageName}`);
    }

    //logging.log(logging.logAction.initPackages, logging.logVariation.success);
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
      logging.message(`${acceleratorPack} is not a valid accelerator pack`);
    }
  });

  /**
   * Get containers for streams, controls, and the chat widget
   */
  const getDefaultContainer = pubSub => document.getElementById(`${pubSub}Container`);
  const getContainerElements = () => {
    const controls = options.controlsContainer || '#videoControls';
    const chat = path('textChat.container', options) || '#chat';
    const stream = options.streamContainers || getDefaultContainer;
    return { stream, controls, chat };
  };
  /** *** *** *** *** */


  /**
   * Return options for the specified package
   * @param {String} packageName
   * @returns {Object}
   */
  const packageOptions = (packageName) => {
    const { streams, streamMap, publishers, subscribers } = internalState.all();
    const accPack = {
      registerEventListener: on,
      on,
      registerEvents,
      triggerEvent,
      setupExternalAnnotation,
      linkAnnotation,
    };
    const containers = getContainerElements();
    const commOptions =
      packageName === 'communication' ?
      Object.assign({},
        options.communication, { publishers, subscribers, streams, streamMap, streamContainers: containers.stream }
      ) : {};
    const chatOptions =
      packageName === 'textChat' ? {
        textChatContainer: options.textChat.container,
        waitingMessage: options.textChat.waitingMessage,
        sender: { alias: options.textChat.name },
      } : {};
    const screenSharingOptions =
      packageName === 'screenSharing' ?
      Object.assign({},
        options.screenSharing, { screenSharingContainer: dom.element(containers.stream('publisher', 'screen')) }) : {};
    const controlsContainer = containers.controls; // Legacy option
    return Object.assign({},
      options[packageName],
      commOptions,
      chatOptions, { session, accPack, controlsContainer },
      screenSharingOptions
    );
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
const validateCredentials = (credentials = []) => {
  const required = ['apiKey', 'sessionId', 'token'];
  required.forEach((credential) => {
    if (!credentials[credential]) {
      logging.error(`${credential} is a required credential`);
    }
  });
};

/**
 * Connect to the session
 * @returns {Promise} <resolve: -, reject: Error>
 */
const connect = () =>
  new Promise((resolve, reject) => {
    logging.log(logging.logAction.connect, logging.logVariation.attempt);
    const session = getSession();
    const { token } = getCredentials();
    session.connect(token, (error) => {
      if (error) {
        logging.message(error);
        logging.log(logging.logAction.connect, logging.logVariation.fail);
        return reject(error);
      }
      const { sessionId, apiKey } = session;
      logging.updateLogAnalytics(sessionId, path('connection.connectionId', session), apiKey);
      logging.log(logging.logAction.connect, logging.logVariation.success);
      initPackages();
      return resolve();
    });
  });

/**
 * Disconnect from the session
 * @returns {Promise} <resolve: -, reject: Error>
 */
const disconnect = () => {
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
const forceDisconnect = connection =>
  new Promise((resolve, reject) => {
    logging.log(logging.logAction.forceDisconnect, logging.logVariation.attempt);
    getSession().forceDisconnect(connection, (error) => {
      if (error) {
        logging.log(logging.logAction.forceDisconnect, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.forceDisconnect, logging.logVariation.success);
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
    logging.log(logging.logAction.forceUnpublish, logging.logVariation.attempt);
    getSession().forceUnpublish(stream, (error) => {
      if (error) {
        logging.log(logging.logAction.forceUnpublish, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.forceUnpublish, logging.logVariation.success);
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
 * @param {Object} to - An OpenTok connection object
 * @returns {Promise} <resolve: empty, reject: Error>
 */
const signal = (type, signalData, to) =>
  new Promise((resolve, reject) => {
    logging.log(logging.logAction.signal, logging.logVariation.attempt);
    const session = getSession();
    const data = JSON.stringify(signalData);
    const signalObj = to ? { type, data, to } : { type, data };
    session.signal(signalObj, (error) => {
      if (error) {
        logging.log(logging.logAction.signal, logging.logVariation.fail);
        reject(error);
      } else {
        logging.log(logging.logAction.signal, logging.logVariation.success);
        resolve();
      }
    });
  });

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
const toggleLocalAudio = (enable) => {
  logging.log(logging.logAction.toggleLocalAudio, logging.logVariation.attempt);
  const { publishers } = internalState.getPubSub();
  const toggleAudio = id => communication.enableLocalAV(id, 'audio', enable);
  Object.keys(publishers.camera).forEach(toggleAudio);
  logging.log(logging.logAction.toggleLocalAudio, logging.logVariation.success);
};

/**
 * Enable or disable local video
 * @param {Boolean} enable
 */
const toggleLocalVideo = (enable) => {
  logging.log(logging.logAction.toggleLocalVideo, logging.logVariation.attempt);
  const { publishers } = internalState.getPubSub();
  const toggleVideo = id => communication.enableLocalAV(id, 'video', enable);
  Object.keys(publishers.camera).forEach(toggleVideo);
  logging.log(logging.logAction.toggleLocalVideo, logging.logVariation.success);
};

/**
 * Enable or disable remote audio
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
const toggleRemoteAudio = (id, enable) => {
  logging.log(logging.logAction.toggleRemoteAudio, logging.logVariation.attempt);
  communication.enableRemoteAV(id, 'audio', enable);
  logging.log(logging.logAction.toggleRemoteAudio, logging.logVariation.success);
};

/**
 * Enable or disable remote video
 * @param {String} id - Subscriber id
 * @param {Boolean} enable
 */
const toggleRemoteVideo = (id, enable) => {
  logging.log(logging.logAction.toggleRemoteVideo, logging.logVariation.attempt);
  communication.enableRemoteAV(id, 'video', enable);
  logging.log(logging.logAction.toggleRemoteVideo, logging.logVariation.success);
}

/**
 * Initialize the accelerator pack
 * @param {Object} options
 * @param {Object} options.credentials
 * @param {Array} [options.packages]
 * @param {Object} [options.containers]
 */
const init = (options) => {
  if (!options) {
    logging.error('Missing options required for initialization');
  }
  const { credentials } = options;
  validateCredentials(options.credentials);

  //init analytics
  logging.initLogAnalytics(window.location.origin, credentials.sessionId, null, credentials.apiKey);
  logging.log(logging.logAction.init, logging.logVariation.attempt);
  const session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  internalState.setSession(session);
  internalState.setCredentials(credentials);
  internalState.setOptions(options);
  logging.log(logging.logAction.init, logging.logVariation.success);
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
  toggleLocalAudio,
  toggleLocalVideo,
  toggleRemoteAudio,
  toggleRemoteVideo,
  subscribe: communication.subscribe,
  unsubscribe: communication.unsubscribe,
};

if (global === window) {
  window.otCore = opentokCore;
}

module.exports = opentokCore;
