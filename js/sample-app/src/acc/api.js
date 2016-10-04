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

/**
 * Session, publishers, and subscribers
 */

// Map publisher ids to publisher objects
const publishers = {
  camera: {},
  screen: {},
};

// Map subscriber id to subscriber objects
const subscribers = {
  camera: {},
  screen: {},
};

// Map stream ids to stream objects
const streams = {};

// Map stream ids to subscriber ids
const streamMap = {};

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
      streams[event.stream.id] = event.stream;
      triggerEvent('streamCreated', event);
    },
    streamDestroyed(event) {
      state.removeStream(event.stream);
      // delete streams[event.stream.id];
      triggerEvent('streamDestroyed', event);
    },
  });

  if (usingAnnotation) {
    on('subscribeToScreen', ({ newSubscriber }) => {
      annotation.start(getSession())
      .then(() => annotation.linkCanvas(newSubscriber, newSubscriber.element.parentElement));
    });

    on('unsubscribeFromScreen', () => {
      annotation.end();
    });
  }

  on('startScreenSharing', publisher => {
    state.addPublisher(publisher);
    // publishers.screen[publisher.id] = publisher;
    if (internalAnnotation) {
      annotation.start(getSession())
      .then(() => annotation.linkCanvas(publisher, publisher.element.parentElement));
    }
  });

  on('endScreenSharing', publisher => {
    delete publishers.screen[publisher.id];
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

  /** Get packages based on ENV */
  const env = typeof module === 'object' && typeof module.exports === 'object' ?
    'node' :
    'browser';

  const availablePackages = {
    textChat: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-text-chat'),
      browser: () => TextChatAccPack, // eslint-disable-line no-undef
    },
    screenSharing: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-screen-sharing'),
      browser: () => ScreenSharingAccPack, // eslint-disable-line no-undef
    },
    annotation: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-annotation'),
      browser: () => AnnotationAccPack, // eslint-disable-line no-undef
    },
    archiving: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-archiving'),
      browser: () => ArchivingAccPack, // eslint-disable-line no-undef
    },
  };
  const packages = {};
  options.packages.forEach((acceleratorPack) => {
    if (availablePackages[acceleratorPack]) { // eslint-disable-next-line no-param-reassign
      const packageName = `${acceleratorPack[0].toUpperCase()}${acceleratorPack.slice(1)}`;
      packages[packageName] = availablePackages[acceleratorPack][env]();
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

module.exports = {
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
};
