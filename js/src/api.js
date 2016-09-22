/**
 * Dependencies
 */
const logging = require('./logging');

/**
 * Individual Accelerator Packs
 */
let communication;
let textChat;
let screenSharing;
let annotation;
let archiving;

/**
 * Session, publishers, and subscribers
 */
// let session;
const publishers = {
  camera: null,
  screen: null,
};
const subscribers = {};
const streams = {};

/**
 * Example options hash for init
 */
const exampleOptions = {
  credentials: {
    apiKey: '123',
    sessionId: '456',
    token: 'tok123',
  },
  // A container can either be a query selector or an HTMLElement
  containers: {
    publisher: {
      camera: '#cameraPublisherContainer', // defaults to #publisherContainer
      screen: '#screenPublisherContainer', // defaults to #publisherContainer
    },
    subscriber: {
      camera: document.getElementById('cameraSubscriberContainer'), // defaults to #subscriberContainer
      screen: document.getElementById('screenSubscriberContainer'), // defaults to #subscriberContainer
    },
  },
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
  communication: {

  },
  textChat: {

  },
  screenSharing: {

  },
  annotation: {

  },
};

/** Eventing */

const registeredEvents = {};

/**
 * Register events that can be listened to be other components/modules
 * @param {array | string} events - A list of event names. A single event may
 * also be passed as a string.
 * @returns {function} See triggerEvent
 */
const registerEvents = events => {
  const eventList = Array.isArray(events) ? events : [events];

  eventList.forEach(event => {
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
    logging.error(`${event} is not a registered event.`);
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
    registeredEvents(event);
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


const createSessionEventListeners = session => {
  registerEvents(['streamCreated', 'streamDestroyed', 'error']);
  session.on({
    streamCreated(event) {
      streams[event.stream.id] = event.stream;
      triggerEvent('streamCreated', event.stream);
    },
    streamDestroyed(event) {
      delete streams[event.stream.id];
      triggerEvent('streamDestroyed', event.stream);
    },
  });
};

const initPackages = (session, options) => {
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
  const getDefaultContainer = pubSub => document.getElementById(`${pubSub}Container`);
  const getContainerElement = (pubSub, type) => {
    const containers = options.containers || {};
    const definedContainer = containers[pubSub] ? containers[pubSub][type] : null;
    if (definedContainer) {
      return typeof definedContainer === 'string' ? document.querySelector(definedContainer) : definedContainer;
    }
    return getDefaultContainer(pubSub);
  };
  const getContainerElements = () =>
    ['publisher', 'subscriber'].reduce((acc, pubSub) =>
      Object.assign({}, acc, { [pubSub]: ['camera', 'screen'].reduce((containerAcc, type) =>
        Object.assign({}, containerAcc, { [type]: getContainerElement(pubSub, type) }), {}) }), {});

  /** Get options based on package */
  const packageOptions = (packageName) => {
    const accPack = { on, registerEvents, triggerEvent };
    const containers = getContainerElements();
    const commOptions = packageName === 'communication' ? { publishers, subscribers, streams, containers } : {};
    return Object.assign({}, options[packageName], commOptions, { session, accPack });
  };

  /** Create instances of each package */
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  communication = require('./communication')(packageOptions('communication'));
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
const validateCredentials = (credentials) => {
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
const connect = () => {
  const session = getSession();
  const { token } = getCredentials();
  session.connect(token);
};

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
  validateCredentials(credentials);
  const session = OT.initSession(credentials.apiKey, credentials.sessionId, (error) => {
    if (error) {
      logging.error(error);
    } else {
      initPackages(session, options);
      createSessionEventListeners(session);
      getSession = () => session;
      getCredentials = () => credentials;
    }
  });
};

module.exports = {
  init,
  connect,
  getSession,
  registeredEvents,
  on,
  registerEventListener: on,
  triggerEvent,
};
