/* eslint-disable */
const logging = require('./logging');
let session;
let publishers;
let subscribers;
let streams;
let streamMap;
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

const currentPubSub = () => ({ publishers, subscribers, meta: pubSubCount() });

let active = false;

// Trigger an event through the API
const triggerEvent = (event, data) => accPack.triggerEvent(event, data);

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


const publish = () =>
  new Promise((resolve, reject) => {
    createPublisher()
      .then((publisher) => {
        publishers.camera[publisher.id] = publisher;
        session.publish(publisher);
        resolve()
      })
      .catch((error) => {
        const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
        triggerEvent('error', errorMessage);
        reject(error);
      });
  });

const subscribe = stream =>
  new Promise((resolve, reject) => {
    if (streamMap[stream.id]) {
      resolve();
    }
    const type = stream.videoType;
    const container = containers.subscriber[type] || 'subscriberContainer';
    const options = type === 'camera' ? callProperties : screenProperties;
    const subscriber = session.subscribe(stream, container, options, (error) => {
      if (error) {
        reject(error);
      } else {
        subscribers[type][subscriber.id] = subscriber;
        streamMap[stream.id] = subscriber.id;
        triggerEvent(`subscribeTo${properCase(type)}`, currentPubSub());
        type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
        resolve();
      }
    });
  })

const startCall = () =>
  new Promise((resolve, reject) => {
    publish()
      .then(() => {
        const initialSubscriptions = Object.keys(streams).map(streamId => subscribe(streams[streamId]));
        Promise.all(initialSubscriptions).then(() => {
          const pubSubData = currentPubSub();
          triggerEvent('startCall', pubSubData);
          active = true;
          resolve(pubSubData);
        }, (reason) => logging.log(`Failed to subscribe to all existing streams: ${reason}`));
      });
  });

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
  streamMap = options.streamMap;
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
