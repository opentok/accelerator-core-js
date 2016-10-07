(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.otCore = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-disable */
const logging = require('./logging');
const state = require('./state');
let session;
let accPack;
let callProperties;
let screenProperties;
let containers = {};
let active = false;

const defaultCallProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off',
  },
};

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param {String} text
 * @returns {String}
 */
const properCase = text => `${text[0].toUpperCase()}${text.slice(1)}`;

/**
 * Trigger an event through the API layer
 * @param {String} event - The name of the event
 * @param {*} [data]
 */
const triggerEvent = (event, data) => accPack.triggerEvent(event, data);

/** Create a camera publisher object */
const createPublisher = () =>
  new Promise((resolve, reject) => {
    // TODO: Handle adding 'name' option to props
    const props = Object.assign({}, callProperties);
    // TODO: Figure out how to handle common vs package-specific options
    const container = containers.publisher.camera || 'publisherContainer';
    const publisher = OT.initPublisher(container, props, error => {
      error ? reject(error) : resolve(publisher);
    });
  });


/** Publish a camera stream */
const publish = () =>
  new Promise((resolve, reject) => {
    createPublisher()
      .then((publisher) => {
        state.addPublisher('camera', publisher);
        session.publish(publisher);
        resolve()
      })
      .catch((error) => {
        const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
        triggerEvent('error', errorMessage);
        reject(error);
      });
  });


/**
 * Subscribe to a stream
 * @param {Object} stream - An OpenTok stream object
 * @returns {Promise} <resolve: >
 */
const subscribe = stream =>
  new Promise((resolve, reject) => {
    if (state.getStreams()[stream.id]) {
      resolve();
    }
    const type = stream.videoType;
    const container = containers.subscriber[type] || 'subscriberContainer';
    const options = type === 'camera' ? callProperties : screenProperties;
    const subscriber = session.subscribe(stream, container, options, (error) => {
      if (error) {
        reject(error);
      } else {
        state.addSubscriber(subscriber);
        triggerEvent(`subscribeTo${properCase(type)}`, Object.assign({}, { subscriber }, state.currentPubSub()));
        type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
        resolve();
      }
    });
  })


/**
 * Start publishing the local camera feed and subscribing to streams in the session
 */
const startCall = () =>
  new Promise((resolve, reject) => {
    publish()
      .then(() => {
        const streams = state.getStreams();
        console.log('initial Streams', streams);
        const initialSubscriptions = Object.keys(state.getStreams()).map(streamId => subscribe(streams[streamId]));
        Promise.all(initialSubscriptions).then(() => {
          const pubSubData = state.currentPubSub();
          triggerEvent('startCall', pubSubData);
          active = true;
          resolve(pubSubData);
        }, (reason) => logging.log(`Failed to subscribe to all existing streams: ${reason}`));
      });
  });


/**
 * Stop publishing and unsubscribe from all streams
 */
const endCall = () => {
  const publishers = state.currentPubSub().publishers;

  const unpublish = publisher => session.unpublish(publisher);
  Object.keys(publishers.camera).forEach(id => unpublish(publishers.camera[id]));
  Object.keys(publishers.screen).forEach(id => unpublish(publishers.screen[id]));
  state.removeAllPublishers();
  active = false;
};

/**
 * Enable/disable local audio or video
 * @param {String} source - 'audio' or 'video'
 * @param {Boolean} enable
 */
const enableLocalAV = (id, source, enable) => {
  const method = `publish${properCase(source)}`;
  const { publishers } = state.currentPubSub()
  publishers.camera[id][method](enable);
};


/**
 * Enable/disable remote audio or video
 * @param {String} subscriberId
 * @param {String} source - 'audio' or 'video'
 * @param {Boolean} enable
 */
const enableRemoteAV = (subscriberId, source, enable) => {
  const method = `publish${properCase(source)}`;
  subscribers[subscriberId][method](enable);
};

const validateOptions = (options) => {
  const requiredOptions = ['session', 'publishers', 'subscribers', 'streams', 'accPack'];

  requiredOptions.forEach((option) => {
    if (!options[option]) {
      logging.error(`${option} is a required option.`);
    }
  });

  session = options.session;
  accPack = options.accPack;
  containers = options.containers;
  callProperties = options.callProperties || defaultCallProperties;
  screenProperties = options.screenProperties ||
    Object.assign({}, defaultCallProperties, { videoSource: 'window' });
};

const onStreamCreated = ({ stream }) => active && subscribe(stream);

const onStreamDestroyed = ({ stream }) => {
  state.removeStream(stream)
  const type = stream.videoType;
  type === 'screen' && triggerEvent('endViewingSharedScreen'); // Legacy event
  triggerEvent(`unsubscribeFrom${properCase(type)}`, state.currentPubSub());
};

// Register listeners with the API
const createEventListeners = () => {
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
const init = (options) =>
  new Promise((resolve) => {
    validateOptions(options);
    createEventListeners();
    resolve();
  });

module.exports = {
  init,
  startCall,
  endCall,
  enableLocalAV,
  enableRemoteAV,
};

},{"./logging":4,"./state":5}],2:[function(require,module,exports){
(function (global){
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
    console.log('end screen sharehere', state.currentPubSub());
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

const toggleLocalAudio = (enable) => {
  const { publishers } = state.currentPubSub();
  const toggleAudio = id => communication.enableLocalAV(id, 'audio', enable);
  Object.keys(publishers.camera).forEach(toggleAudio)
}

const toggleLocalVideo = (enable) => {
  const { publishers } = state.currentPubSub();
  const toggleVideo = id => communication.enableLocalAV(id, 'video', enable);
  Object.keys(publishers.camera).forEach(toggleVideo)
}

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
};


global.opentokCore = module.exports = opentokCore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./communication":1,"./events":3,"./logging":4,"./state":5,"opentok-annotation":undefined,"opentok-archiving":undefined,"opentok-screen-sharing":undefined,"opentok-text-chat":undefined}],3:[function(require,module,exports){
const events = {
  core: [
    'connected',
    'streamCreated',
    'streamDestroyed',
    'startScreenShare',
    'endScreenShare',
    'error',
  ],
  communication: [
    'startCall',
    'endCall',
    'callPropertyChanged',
    'subscribeToCamera',
    'subscribeToScreen',
    'unsubscribeFromCamera',
    'unsubscribeFromScreen',
    'startViewingSharedScreen',
    'endViewingSharedScreen',
  ],
  textChat: [
    'showTextChat',
    'hideTextChat',
    'messageSent',
    'errorSendingMessage',
    'messageReceived',
  ],
  screenSharing: [
    'startScreenSharing',
    'endScreenSharing',
    'screenSharingError',
  ],
  annotation: [
    'startAnnotation',
    'linkAnnotation',
    'resizeCanvas',
    'annotationWindowClosed',
    'endAnnotation',
  ],
  archiving: [
    'startArchive',
    'stopArchive',
    'archiveReady',
    'archiveError',
  ],
};

module.exports = events;



},{}],4:[function(require,module,exports){
// eslint-disable-next-line no-console
const log = message => console.log(`otAccCore: ${message}`);

const error = (message) => {
  throw new Error(`otAccCore: ${message}`);
};

module.exports = {
  log,
  error,
};


},{}],5:[function(require,module,exports){
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

// Map stream ids to subscriber/publisher ids
const streamMap = {};



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
const pubSubCount = () => {
  const pubs = Object.keys(publishers).reduce((acc, source) => {
    acc[source] = Object.keys(publishers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  const subs = Object.keys(subscribers).reduce((acc, source) => {
    acc[source] = Object.keys(subscribers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 */
const currentPubSub = () => ({ publishers, subscribers, meta: pubSubCount() });

const addPublisher = (type, publisher) => {
  streamMap[publisher.streamId] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

const removePublisher = (type, publisher) => {
  const id = publisher.id || streamMap[publisher.streamId];
  delete publishers[type][id];
};

const removeAllPublishers = () => {
  publishers.camera = {};
  publishers.screen = {};
};

const addSubscriber = subscriber => {
  const type = subscriber.stream.videoType;
  const streamId = subscriber.stream.id;
  subscribers[type][subscriber.id] = subscriber;
  streamMap[streamId] = subscriber.id;
};

const addStream = stream => {
  streams[stream.id] = stream;
};

const removeStream = stream => {
  const type = stream.videoType;
  const subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};

const getStreams = () => streams;

const all = () => Object.assign({}, currentPubSub(), { streams, streamMap });

module.exports = {
  addStream,
  removeStream,
  getStreams,
  addPublisher,
  removePublisher,
  removeAllPublishers,
  addSubscriber,
  currentPubSub,
  all,
};

},{}]},{},[2])(2)
});