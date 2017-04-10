/* global OT */

/** Dependencies */
const { CoreError } = require('./errors');
const { dom, path, pathOr, properCase } = require('./util');
const { message, logAnalytics, logAction, logVariation } = require('./logging');


/** Module variables */
// let session;
// let callProperties;
// let screenProperties;
// let streamContainers;
// let autoSubscribe;
// let connectionLimit;
// let active = false;

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
    this.hello();
    this.setSession();
    this.createEventListeners();
  }

  validateOptions = (options) => {
    const requiredOptions = ['core'];
    requiredOptions.forEach((option) => {
      if (!options[option]) {
        throw new CoreError(`${option} is a required option.`, 'invalidParameters');
      }
    });
    this.active = false;
    this.core = options.core;
    this.state = options.state;
    this.streamContainers = options.streamContainers;
    this.callProperties = Object.assign({}, defaultCallProperties, options.callProperties);
    this.connectionLimit = options.connectionLimit || null;
    this.autoSubscribe = options.hasOwnProperty('autoSubscribe') ? options.autoSubscribe : true;
    this.screenProperties = Object.assign({}, defaultCallProperties, { videoSource: 'window' }, options.screenProperties);
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
    if (!this.connectionLimit) {
      return true;
    }
    // Not using the session here since we're concerned with number of active publishers
    const connections = Object.values(this.state.getStreams()).filter(s => s.videoType === 'camera');
    return connections.length < this.connectionLimit;
  };

  /**
   * Create a camera publisher object
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: Object, reject: Error>
   */
  createPublisher = publisherProperties =>
    new Promise((resolve, reject) => {
      // TODO: Handle adding 'name' option to props
      const props = Object.assign({}, this.callProperties, publisherProperties);
      // TODO: Figure out how to handle common vs package-specific options
      // ^^^ This may already be available through package options
      const container = dom.element(this.streamContainers('publisher', 'camera'));
      const publisher = OT.initPublisher(container, props, (error) => {
        error ? reject(error) : resolve(publisher);
      });
    });


  /**
   * Publish the local camera stream and update state
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  publish = publisherProperties =>
    new Promise((resolve, reject) => {
      const onPublish = publisher => (error) => {
        if (error) {
          reject(error);
          logAnalytics(logAction.startCall, logVariation.fail);
        } else {
          logAnalytics(logAction.startCall, logVariation.success);
          this.state.addPublisher('camera', publisher);
          resolve(publisher);
        }
      };

      const publishToSession = publisher => this.session.publish(publisher, onPublish(publisher));

      const handleError = (error) => {
        logAnalytics(logAction.startCall, logVariation.fail);
        const errorMessage = error.code === 1010 ? 'Check your network connection' : error.message;
        this.triggerEvent('error', errorMessage);
        reject(error);
      };

      this.createPublisher(publisherProperties)
        .then(publishToSession)
        .catch(handleError);
    });

  /**
   * Subscribe to a stream and update the state
   * @param {Object} stream - An OpenTok stream object
   * @returns {Promise} <resolve: empty reject: Error >
   */
  subscribe = stream =>
    new Promise((resolve, reject) => {
      let connectionData;
      logAnalytics(logAction.subscribe, logVariation.attempt);
      const streamMap = this.state.getStreamMap();
      const { streamId } = stream;
      if (streamMap[streamId]) {
        // Are we already subscribing to the stream?
        resolve();
      } else {
        // No videoType indicates SIP https://tokbox.com/developer/guides/sip/
        const type = pathOr('sip', 'videoType', stream);
        try {
          connectionData = JSON.parse(path(['connection', 'data'], stream) || null);
        } catch (e) {
          connectionData = path(['connection', 'data'], stream);
        }
        const container = dom.query(this.streamContainers('subscriber', type, connectionData, streamId));
        const options = type === 'camera' || type === 'sip' ? this.callProperties : this.screenProperties;
        const subscriber = this.session.subscribe(stream, container, options, (error) => {
          if (error) {
            logAnalytics(logAction.subscribe, logVariation.fail);
            reject(error);
          } else {
            this.state.addSubscriber(subscriber);
            this.triggerEvent(`subscribeTo${properCase(type)}`, Object.assign({}, { subscriber }, this.state.all()));
            type === 'screen' && this.triggerEvent('startViewingSharedScreen', subscriber); // Legacy event
            logAnalytics(logAction.subscribe, logVariation.success);
            resolve();
          }
        });
      }
    });

  /**
   * Unsubscribe from a stream and update the state
   * @param {Object} subscriber - An OpenTok subscriber object
   * @returns {Promise} <resolve: empty>
   */
  unsubscribe = subscriber =>
    new Promise((resolve) => {
      logAnalytics(logAction.unsubscribe, logVariation.attempt);
      const type = path('stream.videoType', subscriber);
      this.state.removeSubscriber(type, subscriber);
      this.session.unsubscribe(subscriber);
      logAnalytics(logAction.unsubscribe, logVariation.success);
      resolve();
    });

  /**
   * Set session in module scope
   */
  setSession = () => {
    this.session = this.state.getSession();
  };

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
    this.state.removeStream(stream);
    const type = pathOr('sip', 'videoType', stream);
    type === 'screen' && this.triggerEvent('endViewingSharedScreen'); // Legacy event
    this.triggerEvent(`unsubscribeFrom${properCase(type)}`, this.state.getPubSub());
  };

  /**
   * Listen for API-level events
   */
  createEventListeners = () => {
    this.core.on('streamCreated', this.onStreamCreated);
    this.core.on('streamDestroyed', this.onStreamDestroyed);
  };

  /**
   * Start publishing the local camera feed and subscribing to streams in the session
   * @param {Object} publisherProperties
   * @returns {Promise} <resolve: Object, reject: Error>
   */
  startCall = publisherProperties =>
    new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      logAnalytics(logAction.startCall, logVariation.attempt);

      /**
       * Determine if we're able to join the session based on an existing connection limit
       */
      if (!this.ableToJoin()) {
        const errorMessage = 'Session has reached its connection limit';
        this.triggerEvent('error', errorMessage);
        logAnalytics(logAction.startCall, logVariation.fail);
        return reject(new CoreError(errorMessage, 'connectionLimit'));
      }

      /**
       * Subscribe to any streams that existed before we start the call from our side.
       */
      const subscribeToInitialStreams = (publisher) => {
        // Get an array of initial subscription promises
        const initialSubscriptions = () => {
          if (this.autoSubscribe) {
            const streams = this.state.getStreams();
            return Object.keys(streams).map(id => this.subscribe(streams[id]));
          }
          return [Promise.resolve()];
        };

        // Handle success
        const onSubscribeToAll = () => {
          const pubSubData = Object.assign({}, this.state.getPubSub(), { publisher });
          this.triggerEvent('startCall', pubSubData);
          this.active = true;
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

      this.publish(publisherProperties)
        .then(subscribeToInitialStreams)
        .catch(reject);
    });

  /**
   * Stop publishing and unsubscribe from all streams
   */
  endCall = () => {
    logAnalytics(logAction.endCall, logVariation.attempt);
    const { publishers, subscribers } = this.state.getPubSub();
    const unpublish = publisher => this.session.unpublish(publisher);
    Object.values(publishers.camera).forEach(unpublish);
    Object.values(publishers.screen).forEach(unpublish);
    // TODO Promise.all for unsubsribing
    Object.values(subscribers.camera).forEach(this.unsubscribe);
    Object.values(subscribers.screen).forEach(this.unsubscribe);
    this.state.removeAllPublishers();
    this.active = false;
    this.triggerEvent('endCall');
    logAnalytics(logAction.endCall, logVariation.success);
  };

  /**
   * Enable/disable local audio or video
   * @param {String} source - 'audio' or 'video'
   * @param {Boolean} enable
   */
  enableLocalAV = (id, source, enable) => {
    const method = `publish${properCase(source)}`;
    const { publishers } = this.state.getPubSub();
    publishers.camera[id][method](enable);
  };

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
  };

}


// /**
//  * Initialize the communication component
//  * @param {Object} options
//  * @param {Object} options.core
//  * @param {Number} options.connectionLimit
//  * @param {Function} options.streamContainer
//  */
// const init = options =>
//   new Promise((resolve) => {
//     validateOptions(options);
//     setSession();
//     createEventListeners();
//     resolve();
//   });


/** Exports */
// module.exports = {
//   init,
//   startCall,
//   endCall,
//   subscribe,
//   unsubscribe,
//   enableLocalAV,
//   enableRemoteAV,
// };

export default Communication;
