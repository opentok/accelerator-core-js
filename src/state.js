const { pathOr } = require('./util');

class State {
  constructor() {
    this.publishers = {
      camera: {},
      screen: {},
    };

    // Map subscriber id to subscriber objects
    this.subscribers = {
      camera: {},
      screen: {},
      sip: {},
    };

    // Map stream ids to stream objects
    this.streams = {};

    // Map stream ids to subscriber/publisher ids
    this.streamMap = {};

    // The OpenTok session
    this.session = null;

    // OpenTok session credentials
    this.credentials = null;

    // Core options
    this.options = null;
  }
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
  pubSubCount = () => {
    const { publishers, subscribers } = this;
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
  }

  /**
   * Returns the current publishers and subscribers, along with a count of each
   * @returns {Object}
   */
  getPubSub = () => {
    const { publishers, subscribers, pubSubCount } = this;
    return { publishers, subscribers, meta: pubSubCount() };
  }

  /**
   * Get streams, streamMap, publishers, and subscribers
   * @return {Object}
   */
  all = () => {
    const { streams, streamMap, getPubSub } = this;
    return Object.assign({}, { streams, streamMap }, getPubSub());
  }

  /**
   * Get the current OpenTok session
   * @returns {Object}
   */
  getSession = () => this.session;

  /**
   * Set the current OpenTok session
   * @param {Object} otSession
   */
  setSession = (otSession) => {
    this.session = otSession;
  }

  /**
   * Get the current OpenTok credentials
   * @returns {Object}
   */
  getCredentials = () => this.credentials;

  /**
   * Set the current OpenTok credentials
   * @param {Object} otCredentials
   */
  setCredentials = (otCredentials) => {
    this.credentials = otCredentials;
  }

  /**
   * Get the options defined for core
   * @returns {Object}
   */
  getOptions = () => this.options;

  /**
   * Set the options defined for core
   * @param {Object} otOptions
   */
  setOptions = (otOptions) => {
    this.options = otOptions;
  }

  /**
   * Add a stream to state
   * @param {Object} stream - An OpenTok stream object
   */
  addStream = (stream) => {
    this.streams[stream.id] = stream;
  }

  /**
   * Remove a stream from state and any associated subscribers
   * @param {Object} stream - An OpenTok stream object
   */
  removeStream = (stream) => {
    const { streamMap, subscribers, streams } = this;
    const type = pathOr('sip', 'videoType', stream);
    const subscriberId = streamMap[stream.id];
    delete streamMap[stream.id];
    delete subscribers[type][subscriberId];
    delete streams[stream.id];
  }

  /**
   * Get all remote streams
   * @returns {Object}
   */
  getStreams = () => this.streams;

  /**
   * Get the map of stream ids to publisher/subscriber ids
   * @returns {Object}
   */
  getStreamMap = () => this.streamMap;

  /**
   * Add a publisher to state
   * @param {String} type - 'camera' or 'screen'
   * @param {Object} publisher - The OpenTok publisher object
   */
  addPublisher = (type, publisher) => {
    this.streamMap[publisher.streamId] = publisher.id;
    this.publishers[type][publisher.id] = publisher;
  }

  /**
   * Remove a publisher from state
   * @param {String} type - 'camera' or 'screen'
   * @param {Object} publisher - The OpenTok publisher object
   */
  removePublisher = (type, publisher) => {
    const { streamMap, publishers } = this;
    const id = publisher.id || streamMap[publisher.streamId];
    delete publishers[type][id];
    delete streamMap[publisher.streamId];
  }

  /**
   * Remove all publishers from state
   */
  removeAllPublishers = () => {
    const { publishers, removePublisher } = this;
    ['camera', 'screen'].forEach((type) => {
      Object.values(publishers[type]).forEach((publisher) => {
        removePublisher(type, publisher);
      });
    });
  }

  /**
   * Add a subscriber to state
   * @param {Object} - An OpenTok subscriber object
   */
  addSubscriber = (subscriber) => {
    const { subscribers, streamMap } = this;
    const streamId = subscriber.stream.id;
    const type = pathOr('sip', 'stream.videoType', subscriber);
    subscribers[type][subscriber.id] = subscriber;
    streamMap[streamId] = subscriber.id;
  }

  /**
   * Remove a publisher from state
   * @param {String} type - 'camera' or 'screen'
   * @param {Object} subscriber - The OpenTok subscriber object
   */
  removeSubscriber = (type, subscriber) => {
    const { subscribers, streamMap } = this;
    const id = subscriber.id || streamMap[subscriber.streamId];
    delete subscribers[type][id];
    delete streamMap[subscriber.streamId];
  }

  /**
   * Remove all subscribers from state
   */
  removeAllSubscribers = () => {
    ['camera', 'screen', 'sip'].forEach((type) => {
      Object.values(this.subscribers[type]).forEach((subscriber) => {
        this.removeSubscriber(type, subscriber);
      });
    });
  }

  /**
   * Reset state
   */
  reset = () => {
    const { removeAllPublishers, removeAllSubscribers, streams, streamMap } = this;
    removeAllPublishers();
    removeAllSubscribers();
    [streams, streamMap].forEach((streamObj) => {
      Object.keys(streamObj).forEach((streamId) => {
        delete streamObj[streamId]; // eslint-disable-line no-param-reassign
      });
    });
  }
}

/** Export */
export default State;
