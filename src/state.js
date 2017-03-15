const { pathOr } = require('./util');

/**
 * Internal variables
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
  sip: {},
};

// Map stream ids to stream objects
const streams = {};

// Map stream ids to subscriber/publisher ids
const streamMap = {};

let session = null;
let credentials = null;
let options = null;


/**
 * Internal methods
 */

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
  /* eslint-disable no-param-reassign */
  const pubs = Object.keys(publishers).reduce((acc, source) => {
    acc[source] = Object.keys(publishers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  const subs = Object.keys(subscribers).reduce((acc, source) => {
    acc[source] = Object.keys(subscribers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, sip: 0, total: 0 });
  /* eslint-enable no-param-reassign */
  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 * @returns {Object}
 */
const getPubSub = () => ({ publishers, subscribers, meta: pubSubCount() });

/**
 * Get streams, streamMap, publishers, and subscribers
 * @return {Object}
 */
const all = () => Object.assign({}, { streams, streamMap }, getPubSub());

/**
 * Get the current OpenTok session
 * @returns {Object}
 */
const getSession = () => session;

/**
 * Set the current OpenTok session
 * @param {Object} otSession
 */
const setSession = (otSession) => {
  session = otSession;
};

/**
 * Get the current OpenTok credentials
 * @returns {Object}
 */
const getCredentials = () => credentials;

/**
 * Set the current OpenTok credentials
 * @param {Object} otCredentials
 */
const setCredentials = (otCredentials) => {
  credentials = otCredentials;
};

/**
 * Get the options defined for core
 * @returns {Object}
 */
const getOptions = () => options;

/**
 * Set the options defined for core
 * @param {Object} otOptions
 */
const setOptions = (otOptions) => {
  options = otOptions;
};

/**
 * Add a stream to state
 * @param {Object} stream - An OpenTok stream object
 */
const addStream = (stream) => {
  streams[stream.id] = stream;
};

/**
 * Remove a stream from state and any associated subscribers
 * @param {Object} stream - An OpenTok stream object
 */
const removeStream = (stream) => {
  const type = stream.videoType;
  const subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};

/**
 * Get all remote streams
 * @returns {Object}
 */
const getStreams = () => streams;

/**
 * Get the map of stream ids to publisher/subscriber ids
 * @returns {Object}
 */
const getStreamMap = () => streamMap;

/**
 * Add a publisher to state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} publisher - The OpenTok publisher object
 */
const addPublisher = (type, publisher) => {
  streamMap[publisher.streamId] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

/**
 * Remove a publisher from state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} publisher - The OpenTok publisher object
 */
const removePublisher = (type, publisher) => {
  const id = publisher.id || streamMap[publisher.streamId];
  delete publishers[type][id];
  delete streamMap[publisher.streamId];
};

/**
 * Remove all publishers from state
 */
const removeAllPublishers = () => {
  ['camera', 'screen'].forEach((type) => {
    Object.values(publishers[type]).forEach((publisher) => {
      removePublisher(type, publisher);
    });
  });
};

/**
 * Add a subscriber to state
 * @param {Object} - An OpenTok subscriber object
 */
const addSubscriber = (subscriber) => {
  const streamId = subscriber.stream.id;
  const type = pathOr('sip', 'stream.videoType', subscriber);
  subscribers[type][subscriber.id] = subscriber;
  streamMap[streamId] = subscriber.id;
};

/**
 * Remove a publisher from state
 * @param {String} type - 'camera' or 'screen'
 * @param {Object} subscriber - The OpenTok subscriber object
 */
const removeSubscriber = (type, subscriber) => {
  const id = subscriber.id || streamMap[subscriber.streamId];
  delete subscribers[type][id];
  delete streamMap[subscriber.streamId];
};

/**
 * Remove all subscribers from state
 */
const removeAllSubscribers = () => {
  ['camera', 'screen', 'sip'].forEach((type) => {
    Object.values(subscribers[type]).forEach((subscriber) => {
      removeSubscriber(type, subscriber);
    });
  });
};

/**
 * Reset state
 */
const reset = () => {
  removeAllPublishers();
  removeAllSubscribers();
  [streams, streamMap].forEach((streamObj) => {
    Object.keys(streamObj).forEach((streamId) => {
      delete streamObj[streamId]; // eslint-disable-line no-param-reassign
    });
  });
};

/** Exports */
module.exports = {
  all,
  getSession,
  setSession,
  getCredentials,
  setCredentials,
  getOptions,
  setOptions,
  addStream,
  removeStream,
  getStreams,
  getStreamMap,
  addPublisher,
  removePublisher,
  removeAllPublishers,
  addSubscriber,
  removeSubscriber,
  removeAllSubscribers,
  getPubSub,
  reset,
};
