/* global OT */

/** Dependencies */
const { CoreError } = require('./errors');
const { dom, path, pathOr, properCase } = require('./util');
const { message, logAction, logVariation } = require('./logging');

/**
 * Default UI propties
 * https://tokbox.com/developer/guides/customize-ui/js/
 */
const defaultCallProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off',
  },
};
class Communication {
  constructor(options) {
    this.validateOptions(options);
    this.setSession();
    this.createEventListeners();
  }

  validateOptions = (options) => {
    const requiredOptions = ['core', 'state', 'analytics'];
    requiredOptions.forEach((option) => {
      if (!options[option]) {
        throw new CoreError(`${option} is a required option.`, 'invalidParameters');
      }
    });
    const { callProperties, screenProperties, autoSubscribe, subscribeOnly } = options;
    this.active = false;
    this.core = options.core;
    this.state = options.state;
    this.analytics = options.analytics;
    this.streamContainers = options.streamContainers;
    this.callProperties = Object.assign({}, defaultCallProperties, callProperties);
    this.connectionLimit = options.connectionLimit || null;
    this.autoSubscribe = options.hasOwnProperty('autoSubscribe') ? autoSubscribe : true;
    this.subscribeOnly = options.hasOwnProperty('subscribeOnly') ? subscribeOnly : false;
    this.screenProperties = Object.assign({}, defaultCallProperties, { videoSource: 'window' }, screenProperties);
  }
    /**
     * Trigger an event through the API layer
     * @param {String} event - The name of the event
     * @param {*} [data]
     */
  triggerEvent = (event, data) => this.core.triggerEvent(event, data);

  /**
   * Determine whether or not the party is able to join the call based on
   * the specified connection limit, if any.
   * @return {Boolean}
   */
  ableToJoin = () => {
    const { connectionLimit, state } = this;
    if (!connectionLimit) {
      return true;
    }
    // Not using the session here since we're concerned with number of active publishers
    const connections = Object.values(state.getStreams()).filter(s => s.videoType === 'camera');
    return connections.length < connectionLimit;
  };

  /**
   * Create a camera publisher object
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: Object, reject: Error>
   */
  createPublisher = (publisherProperties) => {
    const { callProperties, streamContainers } = this;
    return new Promise((resolve, reject) => {
      // TODO: Handle adding 'name' option to props
      const props = Object.assign({}, callProperties, publisherProperties);
      // TODO: Figure out how to handle common vs package-specific options
      // ^^^ This may already be available through package options
      const container = dom.element(streamContainers('publisher', 'camera'));
      const publisher = OT.initPublisher(container, props, (error) => {
        error ? reject(error) : resolve(publisher);
      });
    });
  }

  /**
   * Publish the local camera stream and update state
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  publish = (publisherProperties) => {
    const { analytics, state, createPublisher, session, triggerEvent, subscribeOnly } = this;

    /**
     * For subscriber tokens or cases where we just don't want to be seen or heard.
     */
    if (subscribeOnly) {
      message('Instance is configured with subscribeOnly set to true. Cannot publish to session');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onPublish = publisher => (error) => {
        if (error) {
          reject(error);
          analytics.log(logAction.startCall, logVariation.fail);
        } else {
          analytics.log(logAction.startCall, logVariation.success);
          state.addPublisher('camera', publisher);
          resolve(publisher);
        }
      };

      const publishToSession = publisher => session.publish(publisher, onPublish(publisher));

      const handleError = (error) => {
        analytics.log(logAction.startCall, logVariation.fail);
        const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
        triggerEvent('error', errorMessage);
        reject(error);
      };

      createPublisher(publisherProperties)
        .then(publishToSession)
        .catch(handleError);
    });
  }

  /**
   * Subscribe to a stream and update the state
   * @param {Object} stream - An OpenTok stream object
   * @param {Object} [subsriberOptions]
   * @param {Boolean} [networkTest] - Are we subscribing to our own publisher for a network test?
   * @returns {Promise} <resolve: Object, reject: Error >
   */
  subscribe = (stream, subscriberProperties = {}, networkTest = false) => {
    const { analytics, state, streamContainers, session, triggerEvent, callProperties, screenProperties } = this;
    return new Promise((resolve, reject) => {
      let connectionData;
      analytics.log(logAction.subscribe, logVariation.attempt);
      const streamMap = state.getStreamMap();
      const { streamId } = stream;
      // No videoType indicates SIP https://tokbox.com/developer/guides/sip/
      const type = pathOr('sip', 'videoType', stream);
      if (streamMap[streamId] && !networkTest) {
        // Are we already subscribing to the stream?
        const { subscribers } = state.all();
        resolve(subscribers[type][streamMap[streamId]]);
      } else {
        try {
          connectionData = JSON.parse(path(['connection', 'data'], stream) || null);
        } catch (e) {
          connectionData = path(['connection', 'data'], stream);
        }
        const container = dom.element(streamContainers('subscriber', type, connectionData, stream));
        const options = Object.assign(
          {},
          type === 'camera' || type === 'sip' ? callProperties : screenProperties,
          subscriberProperties,
        );
        const subscriber = session.subscribe(stream, container, options, (error) => {
          if (error) {
            analytics.log(logAction.subscribe, logVariation.fail);
            reject(error);
          } else {
            state.addSubscriber(subscriber);
            triggerEvent(`subscribeTo${properCase(type)}`, Object.assign({}, { subscriber }, state.all()));
            type === 'screen' && triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
            analytics.log(logAction.subscribe, logVariation.success);
            resolve(subscriber);
          }
        });
      }
    });
  }

  /**
   * Unsubscribe from a stream and update the state
   * @param {Object} subscriber - An OpenTok subscriber object
   * @returns {Promise} <resolve: empty>
   */
  unsubscribe = (subscriber) => {
    const { analytics, session, state } = this;
    return new Promise((resolve) => {
      analytics.log(logAction.unsubscribe, logVariation.attempt);
      const type = pathOr('sip', 'stream.videoType', subscriber);
      state.removeSubscriber(type, subscriber);
      session.unsubscribe(subscriber);
      analytics.log(logAction.unsubscribe, logVariation.success);
      resolve();
    });
  }

  /**
   * Set session in module scope
   */
  setSession = () => {
    this.session = this.state.getSession();
  }

  /**
   * Subscribe to new stream unless autoSubscribe is set to false
   * @param {Object} stream
   */
  onStreamCreated = ({ stream }) => this.active && this.autoSubscribe && this.subscribe(stream);

  /**
   * Update state and trigger corresponding event(s) when stream is destroyed
   * @param {Object} stream
   */
  onStreamDestroyed = ({ stream }) => {
    const { state, triggerEvent } = this;
    state.removeStream(stream);
    const type = pathOr('sip', 'videoType', stream);
    type === 'screen' && triggerEvent('endViewingSharedScreen'); // Legacy event
    triggerEvent(`unsubscribeFrom${properCase(type)}`, state.getPubSub());
  }

  /**
   * Listen for API-level events
   */
  createEventListeners = () => {
    const { core, onStreamCreated, onStreamDestroyed } = this;
    core.on('streamCreated', onStreamCreated);
    core.on('streamDestroyed', onStreamDestroyed);
  }

  /**
   * Start publishing the local camera feed and subscribing to streams in the session
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: Object, reject: Error>
   */
  startCall = (publisherProperties) => {
    const { analytics, state, subscribe, ableToJoin, triggerEvent, autoSubscribe, publish } = this;
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      analytics.log(logAction.startCall, logVariation.attempt);
      
      this.active = true;
      const initialStreamIds = Object.keys(state.getStreams());

      /**
       * Determine if we're able to join the session based on an existing connection limit
       */
      if (!ableToJoin()) {
        const errorMessage = 'Session has reached its connection limit';
        triggerEvent('error', errorMessage);
        analytics.log(logAction.startCall, logVariation.fail);
        return reject(new CoreError(errorMessage, 'connectionLimit'));
      }

      /**
       * Subscribe to any streams that existed before we start the call from our side.
       */
      const subscribeToInitialStreams = (publisher) => {
        // Get an array of initial subscription promises
        const initialSubscriptions = () => {
          if (autoSubscribe) {
            const streams = state.getStreams();
            return initialStreamIds.map(id => subscribe(streams[id]));
          }
          return [Promise.resolve()];
        };

        // Handle success
        const onSubscribeToAll = () => {
          const pubSubData = Object.assign({}, state.getPubSub(), { publisher });
          triggerEvent('startCall', pubSubData);
          resolve(pubSubData);
        };

        // Handle error
        const onError = (reason) => {
          message(`Failed to subscribe to all existing streams: ${reason}`);
          // We do not reject here in case we still successfully publish to the session
          resolve(Object.assign({}, this.state.getPubSub(), { publisher }));
        };

        Promise.all(initialSubscriptions())
          .then(onSubscribeToAll)
          .catch(onError);
      };

      publish(publisherProperties)
        .then(subscribeToInitialStreams)
        .catch(reject);
    });
  }

  /**
   * Stop publishing and unsubscribe from all streams
   */
  endCall = () => {
    const { analytics, state, session, unsubscribe, triggerEvent } = this;
    analytics.log(logAction.endCall, logVariation.attempt);
    const { publishers, subscribers } = state.getPubSub();
    const unpublish = publisher => session.unpublish(publisher);
    Object.values(publishers.camera).forEach(unpublish);
    Object.values(publishers.screen).forEach(unpublish);
    // TODO Promise.all for unsubsribing
    Object.values(subscribers.camera).forEach(unsubscribe);
    Object.values(subscribers.screen).forEach(unsubscribe);
    state.removeAllPublishers();
    this.active = false;
    triggerEvent('endCall');
    analytics.log(logAction.endCall, logVariation.success);
  }

  /**
   * Enable/disable local audio or video
   * @param {String} source - 'audio' or 'video'
   * @param {Boolean} enable
   */
  enableLocalAV = (id, source, enable) => {
    const method = `publish${properCase(source)}`;
    const { publishers } = this.state.getPubSub();
    publishers.camera[id][method](enable);
  }

  /**
   * Enable/disable remote audio or video
   * @param {String} subscriberId
   * @param {String} source - 'audio' or 'video'
   * @param {Boolean} enable
   */
  enableRemoteAV = (subscriberId, source, enable) => {
    const method = `subscribeTo${properCase(source)}`;
    const { subscribers } = this.state.getPubSub();
    const subscriber = subscribers.camera[subscriberId] || subscribers.sip[subscriberId];
    subscriber[method](enable);
  }

}

export default Communication;
