const logging = require('./logging');
let session;
let publishers;
let subscribers;
let streams;
let accPack;
let callProperties;
let screenProperties;

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

// Register events with the API
const registerEvents = () => {
  const events = [
    'startCall',
    'endCall',
    'callPropertyChanged',
    'subscribeToCamera',
    'startViewingSharedScreen',
    'endViewingSharedScreen',
  ];
  accPack.registerEvents(events);
};

// Trigger an event through the API
const triggerEvent = (event, data) => accPack.triggerEvent(event, data);

const startCall = () => {
  active = true;
  publish();
  streams.forEach(stream => subscribe(stream));
  triggerEvent('startCall', publishers.camera);
};


const endCall = () => {
  active = false;
};

const enableLocalAV = (source, enable) => {
  const method = `publish${source[0].toUpperCase()}${source.slice(1)}`;
  publishers.camera[method](enable);
};

const enableRemoteAV = (subscriberId, source, enable) => {
  const method = `publish${source[0].toUpperCase()}${source.slice(1)}`;
  subscribers[subscriberId][method](enable);
};

const validateOptions = options => {
  const requiredOptions = ['session', 'publishers', 'subscribers', 'streams', 'accPack'];
  requiredOptions.forEach(option => {
    if (!options[option]) {
      logging.error(`${option} is a required option.`);
    }
  });

  session = options.session;
  publishers = options.publishers;
  subscribers = options.subscribers;
  streams = options.streams;
  accPack = options.accPack;
  callProperties = options.callProperties || defaultCallProperties;
  screenProperties = options.screenProperties ||
    Object.assign({}, defaultCallProperties, { videoSource: 'window' });
};

const onStreamCreated = stream => {
  const type = stream.videoType;
  const container = options.containers.subscribers[type] || 'subcriberContainer';
  const options = type === 'camera' ? callProperties : screenProperties;
  const subscriber = session.subscribe(streams[stream.streamId], container, options, error => {
    triggerEvent('error', error);
  });
  subscribers[subscriber.id] = subscriber;
};

const onStreamDestroyed = stream =>
  stream.videoType === 'screen' && triggerEvent('endViewingSharedScreen');


// Register listeners with theAPI
const createEventListeners = () => {
  accPack.registerEventListener('streamCreated', onStreamCreated);
  accPack.registerEventListener('streamDestroyed', onStreamDestroyed);
};

/**
 * Initialize the communication component
 * @param {Object} options
 * @param {Object} options.session
 * @param {Object} options.publishers
 * @param {Object} options.subscribers
 * @param {Object} options.streams
 */
const init = options => {
  validateOptions(options);
  registerEvents();
  createEventListeners();
};

const createPublisher = () =>
  new Promise((resolve, reject) => {
    // TODO: Handle adding 'name' option to props
    const props = callProperties;
    // TODO: Figure out how to handle common vs package-specific options
    const container = options.container || 'publisherContainer';
    const publisher = OT.initPublisher(container, props, error => {
      if (error) {
        reject(error);
      }
      resolve(publisher);
    });
  });


const publish = () => {
  createPublisher()
    .then(publisher => {
      publishers.camera = publisher;
      session.publish(publisher);
    })
    .catch(error => {
      const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
      triggerEvent('error', errorMessage);
    });
};


module.exports = {
  init,
  startCall,
  endCall,
  enableLocalAV,
  enableRemoteAV,
};
