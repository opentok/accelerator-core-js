/* global OT */

/* Dependencies */
const State = require('./state');
const { SDKError } = require('./errors');

/* Internal variables */

const stateMap = new WeakMap();

/* Internal methods */

/**
 * Ensures that we have the required credentials
 * @param {Object} credentials
 * @param {String} credentials.apiKey
 * @param {String} credentials.sessionId
 * @param {String} credentials.token
 * @returns {Object}
 */
const validateCredentials = (credentials = {}) => {
  const required = ['apiKey', 'sessionId', 'token'];
  required.forEach((credential) => {
    if (!credentials[credential]) {
      throw new SDKError(`${credential} is a required credential`, 'invalidParameters');
    }
  });
  return credentials;
};

/**
 * Initialize an OpenTok publisher object
 * @param {String | Object} element - The target element
 * @param {Object} properties - The publisher properties
 * @returns {Promise} <resolve: Object, reject: Error>
 */
const initPublisher = (element, properties) =>
  new Promise((resolve, reject) => {
    const publisher = OT.initPublisher(element, properties, (error) => {
      error ? reject(error) : resolve(publisher);
    });
  });

/**
 * Binds and sets a single event listener on the OpenTok session
 * @param {String} event - The name of the event
 * @param {Function} callback
 */
const bindListener = (target, context, event, callback) => {
  const paramsError = '\'on\' requires a string and a function to create an event listener.';
  if (typeof event !== 'string' || typeof callback !== 'function') {
    throw new SDKError(paramsError, 'invalidParameters');
  }
  target.on(event, callback.bind(context));
};

/**
 * Bind and set event listeners
 * @param {Object} target - An OpenTok session, publisher, or subscriber object
 * @param {Object} context - The context to which to bind event listeners
 * @param {Object | Array} listeners - An object (or array of objects) with
 *        eventName/callback k/v pairs
 */
const bindListeners = (target, context, listeners) => {
  /**
   * Create listeners from an object with event/callback k/v pairs
   * @param {Object} listeners
   */
  const createListenersFromObject = (eventListeners) => {
    Object.keys(eventListeners).forEach((event) => {
      bindListener(target, context, event, eventListeners[event]);
    });
  };

  if (Array.isArray(listeners)) {
    listeners.forEach(listener => createListenersFromObject(listener));
  } else {
    createListenersFromObject(listeners);
  }
};

/**
 * @class
 * Represents an OpenTok SDK Wrapper
 */
class OpenTokSDK {
  /**
   * Create an SDK Wrapper
   * @param {Object} credentials
   * @param {String} credentials.apiKey
   * @param {String} credentials.sessionId
   * @param {String} credentials.token
   */
  constructor(credentials) {
    this.credentials = validateCredentials(credentials);
    stateMap.set(this, new State());
    this.session = OT.initSession(credentials.apiKey, credentials.sessionId);
  }

  /**
   * Determines if a connection object is my local connection
   * @param {Object} connection - An OpenTok connection object
   * @returns {Boolean}
   */
  isMe(connection) {
    const { session } = this;
    return session && session.connection.connectionId === connection.connectionId;
  }

  /**
   * Wrap OpenTok session events
   */
  setInternalListeners() {
    /**
     * Wrap session events and update state when streams are created
     * or destroyed
     */
    const state = stateMap.get(this);
    this.session.on('streamCreated', ({ stream }) => state.addStream(stream));
    this.session.on('streamDestroyed', ({ stream }) => state.removeStream(stream));
    this.session.on('sessionConnected sessionReconnected', () => state.setConnected(true));
    this.session.on('sessionDisconnected', () => state.setConnected(false));
  }

  /**
   * Register a callback for a specific event, pass an object
   * with event => callback key/values (or an array of objects)
   * to register callbacks for multiple events.
   * @param {String | Object | Array} [events] - The name of the events
   * @param {Function} [callback]
   * https://tokbox.com/developer/sdks/js/reference/Session.html#on
   */
  on(...args) {
    if (args.length === 1 && typeof args[0] === 'object') {
      bindListeners(this.session, this, args[0]);
    } else if (args.length === 2) {
      bindListener(this.session, this, args[0], args[1]);
    }
  }

  /**
   * Remove a callback for a specific event. If no parameters are passed,
   * all callbacks for the session will be removed.
   * @param {String} [events] - The name of the events
   * @param {Function} [callback]
   * https://tokbox.com/developer/sdks/js/reference/Session.html#off
   */
  off(...args) {
    this.session.off(...args);
  }

  /**
   * Enable or disable local publisher audio
   * @param {Boolean} enable
   */
  enablePublisherAudio(enable) {
    const { publishers } = stateMap.get(this).getPubSub();
    Object.keys(publishers.camera).forEach((publisherId) => {
      publishers.camera[publisherId].publishAudio(enable);
    });
  }

  /**
   * Enable or disable local publisher video
   * @param {Boolean} enable
   */
  enablePublisherVideo(enable) {
    const { publishers } = stateMap.get(this).getPubSub();
    Object.keys(publishers.camera).forEach((publisherId) => {
      publishers.camera[publisherId].publishVideo(enable);
    });
  }

  /**
   * Enable or disable local subscriber audio
   * @param {String} streamId
   * @param {Boolean} enable
   */
  enableSubscriberAudio(streamId, enable) {
    const { streamMap, subscribers } = stateMap.get(this).all();
    const subscriberId = streamMap[streamId];
    const subscriber = subscribers.camera[subscriberId] || subscribers.screen[subscriberId];
    subscriber && subscriber.subscribeToAudio(enable);
  }

  /**
   * Enable or disable local subscriber video
   * @param {String} streamId
   * @param {Boolean} enable
   */
  enableSubscriberVideo(streamId, enable) {
    const { streamMap, subscribers } = stateMap.get(this).all();
    const subscriberId = streamMap[streamId];
    const subscriber = subscribers.camera[subscriberId] || subscribers.screen[subscriberId];
    subscriber && subscriber.subscribeToVideo(enable);
  }

  /**
   * Create and publish a stream
   * @param {String | Object} element - The target element
   * @param {Object} properties - The publisher properties
   * @param {Array | Object} [eventListeners] - An object (or array of objects) with
   *        eventName/callback k/v pairs
   * @param {Boolean} [preview] - Create a publisher with publishing to the session
   * @returns {Promise} <resolve: Object, reject: Error>
   */
  publish(element, properties, eventListeners = null, preview = false) {
    return new Promise((resolve, reject) => {
      initPublisher(element, properties) // eslint-disable-next-line no-confusing-arrow
        .then((publisher) => {
          eventListeners && bindListeners(publisher, this, eventListeners);
          if (preview) {
            resolve(publisher);
          } else {
            this.publishPreview(publisher)
              .then(resolve)
              .catch(reject);
          }
        }).catch(reject);
    });
  }

  /**
   * Publish a 'preview' stream to the session
   * @param {Object} publisher - An OpenTok publisher object
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  publishPreview(publisher) {
    return new Promise((resolve, reject) => {
      const state = stateMap.get(this);
      this.session.publish(publisher, (error) => {
        error && reject(error);
        const type = publisher.stream.videoType;
        state.addPublisher(type, publisher);
        resolve(publisher);
      });
    });
  }

  /**
   * Stop publishing a stream
   * @param {Object} publisher - An OpenTok publisher object
   */
  unpublish(publisher) {
    const type = publisher.stream.videoType;
    const state = stateMap.get(this);
    this.session.unpublish(publisher);
    state.removePublisher(type, publisher);
  }

  /**
   * Subscribe to stream
   * @param {Object} stream
   * @param {String | Object} container - The id of the container or a reference to the element
   * @param {Object} [properties]
   * @param {Array | Object} [eventListeners] - An object (or array of objects) with
   *        eventName/callback k/v pairs
   * @returns {Promise} <resolve: empty, reject: Error>
   * https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
   */
  subscribe(stream, container, properties, eventListeners) {
    const state = stateMap.get(this);
    return new Promise((resolve, reject) => {
      const subscriber = this.session.subscribe(stream, container, properties, (error) => {
        if (error) {
          reject(error);
        } else {
          state.addSubscriber(subscriber);
          eventListeners && bindListeners(subscriber, this, eventListeners);
          resolve(subscriber);
        }
      });
    });
  }

  /**
   * Unsubscribe from a stream and update the state
   * @param {Object} subscriber - An OpenTok subscriber object
   * @returns {Promise} <resolve: empty>
   */
  unsubscribe(subscriber) {
    const state = stateMap.get(this);
    return new Promise((resolve) => {
      this.session.unsubscribe(subscriber);
      state.removeSubscriber(subscriber);
      resolve();
    });
  }

  /**
   * Connect to the OpenTok session
   * @param {Array | Object} [eventListeners] - An object (or array of objects) with
   *        eventName/callback k/v pairs
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  connect(eventListeners) {
    this.off();
    this.setInternalListeners();
    eventListeners && this.on(eventListeners);
    return new Promise((resolve, reject) => {
      const { token } = this.credentials;
      this.session.connect(token, (error) => {
        error ? reject(error) : resolve();
      });
    });
  }

  /**
   * Force a remote connection to leave the session
   * @param {Object} connection
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  forceDisconnect(connection) {
    return new Promise((resolve, reject) => {
      this.session.forceDisconnect(connection, (error) => {
        error ? reject(error) : resolve();
      });
    });
  }

  /**
   * Force the publisher of a stream to stop publishing the stream
   * @param {Object} stream
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  forceUnpublish(stream) {
    return new Promise((resolve, reject) => {
      this.session.forceUnpublish(stream, (error) => {
        error ? reject(error) : resolve();
      });
    });
  }


  /**
   * Send a signal using the OpenTok signaling apiKey
   * @param {String} type
   * @param {*} signalData
   * @param {Object} [to] - An OpenTok connection object
   * @returns {Promise} <resolve: empty, reject: Error>
   * https://tokbox.com/developer/guides/signaling/js/
   */
  signal(type, signalData, to) {
    const data = JSON.stringify(signalData);
    const signal = to ? { type, data, to } : { type, data };
    return new Promise((resolve, reject) => {
      this.session.signal(signal, (error) => {
        error ? reject(error) : resolve();
      });
    });
  }

  /**
   * Disconnect from the OpenTok session
   */
  disconnect() {
    this.session.disconnect();
    stateMap.get(this).reset();
  }

  /**
   * Return the state of the OpenTok session
   * @returns {Object} Streams, publishers, subscribers, and stream map
   */
  state() {
    return stateMap.get(this).all();
  }
}

if (global === window) {
  window.OpenTokSDK = OpenTokSDK;
}

module.exports = OpenTokSDK;
