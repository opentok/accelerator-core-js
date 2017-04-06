class State {
  constructor() {
    this.publishers = {
      camera: {},
      screen: {},
    };

    this.subscribers = {
      camera: {},
      screen: {},
    };

    this.streams = {};

    // Map stream ids to subscriber/publisher ids
    this.streamMap = {};

    // OpenTok session
    this.session = null;

    // OpenTok credentials
    this.credentials = null;

    // Session Connection Status
    this.connected = false;
  }

  // Set the current connection state
  setConnected(connected) {
    this.connected = connected;
  }

  // Get the current OpenTok session
  getSession() {
    return this.session;
  }

  // Set the current OpenTok session
  setSession(session) {
    this.session = session;
  }

  // Get the current OpenTok credentials
  getCredentials() {
    return this.credentials;
  }
    // Set the current OpenTok credentials
  setCredentials(credentials) {
    this.credentials = credentials;
  }

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
  pubSubCount() {
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
    }, { camera: 0, screen: 0, total: 0 });
    /* eslint-enable no-param-reassign */
    return { publisher: pubs, subscriber: subs };
  }

  /**
   * Returns the current publishers and subscribers, along with a count of each
   */
  getPubSub() {
    const { publishers, subscribers } = this;
    return { publishers, subscribers, meta: this.pubSubCount() };
  }

  addPublisher(type, publisher) {
    this.streamMap[publisher.streamId] = publisher.id;
    this.publishers[type][publisher.id] = publisher;
  }

  removePublisher(type, publisher) {
    const id = publisher.id || this.streamMap[publisher.streamId];
    delete this.publishers[type][id];
  }

  removeAllPublishers() {
    this.publishers.camera = {};
    this.publishers.screen = {};
  }

  addSubscriber(subscriber) {
    const type = subscriber.stream.videoType;
    const streamId = subscriber.stream.id;
    this.subscribers[type][subscriber.id] = subscriber;
    this.streamMap[streamId] = subscriber.id;
  }

  removeSubscriber(subscriber = {}) {
    const { stream } = subscriber;
    const type = stream && stream.videoType;
    delete this.subscribers[type][subscriber.id];
  }

  addStream(stream) {
    this.streams[stream.id] = stream;
  }

  removeStream(stream) {
    const type = stream.videoType;
    const subscriberId = this.streamMap[stream.id];
    delete this.streamMap[stream.id];
    delete this.streams[stream.id];
    this.removeSubscriber(this.subscribers[type][subscriberId]);
  }

  getStreams() {
    return this.streams;
  }

  /** Reset streams, publishers, and subscribers */
  reset() {
    this.streams = {};
    this.streamMap = {};
    this.publishers = { camera: {}, screen: {} };
    this.subscribers = { camera: {}, screen: {} };
  }

  all() {
    const { streams, streamMap, connected } = this;
    return Object.assign({}, this.getPubSub(), { streams, streamMap, connected });
  }
}

module.exports = State;
