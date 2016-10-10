/* global OT */
/**
 * Dependencies
 */
const logging = require('./logging');
const communication = require('./communication');
const accPackEvents = require('./events');
const state = require('./state');

/**
 * Individual Accelerator Packs
 */
let textChat;
let screenSharing;
let annotation;
let archiving;

/** Eventing */

const registeredEvents = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 * @returns {function} See triggerEvent
 */
const registerEvents = (events) => {
  const eventList = Array.isArray(events) ? events : [events];
  eventList.forEach((event) => {
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
const on = (event, callback) => {
  const eventCallbacks = registeredEvents[event];
  if (!eventCallbacks) {
    logging.log(`${event} is not a registered event.`);
  } else {
    eventCallbacks.add(callback);
  }
};

/**
 * Trigger an event and fire all registered callbacks
 * @param {String} event - The name of the event
 * @param {*} data - Data to be passed to callback functions
 */
const triggerEvent = (event, data) => {
  const eventCallbacks = registeredEvents[event];
  if (!eventCallbacks) {
    registerEvents(event);
    logging.log(`${event} has been registered as a new event.`);
  } else {
    eventCallbacks.forEach(callback => callback(data, event));
  }
};

/** Returns the current OpenTok session object */
// const getSession = () => session;
let getSession;

/** Returns the current OpenTok session credentials */
let getCredentials;

/** Returns the options used for initialization */
let getOptions;


const createEventListeners = (session, options) => {
  Object.keys(accPackEvents).forEach(type => registerEvents(accPackEvents[type]));

  /**
   * If using screen sharing + annotation in an external window, the individual packages
   * will take care of
   */
  const usingAnnotation = options.screenSharing.annotation;
  const internalAnnotation = usingAnnotation && !options.screenSharing.externalWindow;

  session.on({
    streamCreated(event) {
      state.addStream(event.stream);
      triggerEvent('streamCreated', event);
    },
    streamDestroyed(event) {
      state.removeStream(event.stream);
      // delete streams[event.stream.id];
      triggerEvent('streamDestroyed', event);
    },
  });

  if (usingAnnotation) {
    on('subscribeToScreen', ({ subscriber }) => {
      annotation.start(getSession())
        .then(() => annotation.linkCanvas(subscriber, subscriber.element.parentElement));
    });

    on('unsubscribeFromScreen', () => {
      annotation.end();
    });
  }

  on('startScreenSharing', (publisher) => {
    state.addPublisher('screen', publisher);
    triggerEvent('startScreenShare', Object.assign({}, { publisher }, state.currentPubSub()));
    // publishers.screen[publisher.id] = publisher;
    if (internalAnnotation) {
      annotation.start(getSession())
        .then(() => annotation.linkCanvas(publisher, publisher.element.parentElement));
    }
  });

  on('endScreenSharing', (publisher) => {
    // delete publishers.screen[publisher.id];
    state.removePublisher('screen', publisher);
    triggerEvent('endScreenShare', state.currentPubSub());
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
    const streams = state.getStreams();
    const cameraStreams = Object.keys(streams).reduce((acc, streamId) => {
      const stream = streams[streamId];
      return stream.videoType === 'camera' ? acc.concat(stream) : acc;
    }, []);
    cameraStreams.forEach(annotation.addSubscriberToExternalWindow);
  }
};

const initPackages = () => {
  const session = getSession();
  const options = getOptions();

  const optionalRequire = (packageName, globalName) => {
    let result;
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
      logging.error(`Could not load ${packageName}`);
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
  options.packages.forEach((acceleratorPack) => {
    if (availablePackages[acceleratorPack]) { // eslint-disable-next-line no-param-reassign
      const packageName = `${acceleratorPack[0].toUpperCase()}${acceleratorPack.slice(1)}`;
      packages[packageName] = availablePackages[acceleratorPack]();
    } else {
      logging.log(`${acceleratorPack} is not a valid accelerator pack`);
    }
  });

  /** Build containers hash */
  const containerOptions = options.containers || {};
  const getDefaultContainer = pubSub => document.getElementById(`${pubSub}Container`);
  const getContainerElement = (pubSub, type) => {
    const definedContainer = containerOptions[pubSub] ? containerOptions[pubSub][type] : null;
    if (definedContainer) {
      return typeof definedContainer === 'string' ? document.querySelector(definedContainer) : definedContainer;
    }
    return getDefaultContainer(pubSub);
  };
  const getContainerElements = () => {
    const controls = containerOptions.controls || '#videoControls';
    const chat = containerOptions.chat || '#chat';
    return ['publisher', 'subscriber'].reduce((acc, pubSub) =>
      Object.assign({}, acc, {
        [pubSub]: ['camera', 'screen'].reduce((containerAcc, type) =>
          Object.assign({}, containerAcc, {
            [type]: getContainerElement(pubSub, type),
          }), {}),
      }), { controls, chat });
  };

  /** Get options based on package */
  const packageOptions = (packageName) => {
    const { streams, streamMap, publishers, subscribers } = state.all();
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
        options.communication, { publishers, subscribers, streams, streamMap, containers }) : {};
    const chatOptions =
      packageName === 'textChat' ? {
        textChatContainer: containers.chat,
        waitingMessage: options.textChat.waitingMessage,
        sender: { alias: options.textChat.name },
      } : {};
    const screenSharingOptions =
      packageName === 'screenSharing' ?
      Object.assign({},
        options.screenSharing, { screenSharingContainer: containers.publisher.screen }) : {};
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
 */
const connect = () =>
  new Promise((resolve, reject) => {
    const session = getSession();
    const { token } = getCredentials();
    session.connect(token, (error) => {
      if (error) {
        logging.message(error);
        reject(error);
      }
      initPackages();
      resolve();
    });
  });

/**
 * Enable or disable local audio
 * @param {Boolean} enable
 */
const toggleLocalAudio = (enable) => {
  const { publishers } = state.currentPubSub();
  const toggleAudio = id => communication.enableLocalAV(id, 'audio', enable);
  Object.keys(publishers.camera).forEach(toggleAudio);
};

/**
 * Enable or disable local video
 * @param {Boolean} enable
 */
const toggleLocalVideo = (enable) => {
  const { publishers } = state.currentPubSub();
  const toggleVideo = id => communication.enableLocalAV(id, 'video', enable);
  Object.keys(publishers.camera).forEach(toggleVideo);
};

/**
 * Enable or disable remote audio
 * @param {String} id - Publisher id
 * @param {Boolean} enable
 */
const toggleRemoteAudio = (id, enable) => communication.enableRemoteAV(id, 'audio', enable);


/**
 * Enable or disable local video
 * @param {String} id - Publisher id
 * @param {Boolean} enable
 */
const toggleRemoteVideo = (id, enable) => communication.enableRemoteAV(id, 'video', enable);


/**
 * Initialize the accelerator pack
 * @param {Object} options
 * @param {Object} options.credentials
 */
const init = (options) => {
  if (!options) {
    logging.error('Missing options required for initialization');
  }
  const { credentials } = options;
  validateCredentials(options.credentials);
  const session = OT.initSession(credentials.apiKey, credentials.sessionId);
  createEventListeners(session, options);
  getSession = () => session;
  getCredentials = () => credentials;
  getOptions = () => options;
};

const opentokCore = {
  init,
  connect,
  getSession,
  getCredentials,
  registerEvents,
  on,
  registerEventListener: on,
  triggerEvent,
  startCall: communication.startCall,
  endCall: communication.endCall,
  toggleLocalAudio,
  toggleLocalVideo,
  toggleRemoteAudio,
  toggleRemoteVideo,
};

if (global === window) {
  window.otCore = opentokCore;
}

module.exports = opentokCore;
