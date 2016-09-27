/* eslint-disable */
const logging = require('./logging');
let session;
let publishers;
let subscribers;
let streams;
let accPack;
let callProperties;
let screenProperties;
let containers = {};

const properCase = text => `${text[0].toUpperCase()}${text.slice(1)}`;

const defaultCallProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off',
  },
};

let active = false;

// Trigger an event through the API
const triggerEvent = (event, data) => accPack.triggerEvent(event, data);

const createPublisher = () =>
  new Promise((resolve, reject) => {
    // TODO: Handle adding 'name' option to props
    const props = callProperties;
    // TODO: Figure out how to handle common vs package-specific options
    const container = containers.publisher.camera || 'publisherContainer';
    const publisher = OT.initPublisher(container, props, error => {
      error ? reject(error) : resolve(publisher);
    });
  });


const publish = () => {
  createPublisher()
    .then((publisher) => {
      publishers.camera = publisher;
      session.publish(publisher);
    })
    .catch((error) => {
      const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
      triggerEvent('error', errorMessage);
    });
};

const subscribe = stream => {

  const type = stream.videoType;
  const container = containers.subscriber[type] || 'subcriberContainer';
  const options = type === 'camera' ? callProperties : screenProperties;
  const subscriber = session.subscribe(streams[stream.streamId], container, options, (error) => {
    if (error) {
      triggerEvent('error', error);
    } else {
      subscribers[type][subscriber.id] = subscriber;
      triggerEvent(`subcribeTo${properCase(type)}`);
      type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
    }
  });
}

const startCall = () => {
  active = true;
  publish();
  Object.keys(streams).forEach(streamId => subscribe(streams[streamId]));
  triggerEvent('startCall', publishers.camera);
  return Object.keys(subscribers.camera).length;
};


const endCall = () => {
  active = false;
};

const enableLocalAV = (source, enable) => {
  const method = `publish${properCase(source)}`;
  publishers.camera[method](enable);
};

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
  publishers = options.publishers;
  subscribers = options.subscribers;
  streams = options.streams;
  accPack = options.accPack;
  containers = options.containers;
  callProperties = options.callProperties || defaultCallProperties;
  screenProperties = options.screenProperties ||
    Object.assign({}, defaultCallProperties, { videoSource: 'window' });
};

const onStreamCreated = ({ stream }) => active && subscribe(stream);

const onStreamDestroyed = ({ stream }) =>
  stream.videoType === 'screen' && triggerEvent('endViewingSharedScreen');


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
