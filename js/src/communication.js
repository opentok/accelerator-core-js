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
  const method = `subscribeTo${properCase(source)}`;
  const { subscribers } = state.currentPubSub();
  subscribers.camera[subscriberId][method](enable);
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
