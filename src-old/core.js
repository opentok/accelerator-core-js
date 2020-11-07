/* global OT */
/**
 * Dependencies
 */
const util = require('./util');
const State = require('./state').default;
const accPackEvents = require('./events');
const Communication = require('./communication').default;
const OpenTokSDK = require('./sdk-wrapper/sdkWrapper');
const { CoreError } = require('./errors');
const {
  message,
  Analytics,
  logAction,
  logVariation,
} = require('./logging');


/**
 * Helper methods
 */
const { dom, path, pathOr, properCase } = util;

/**
 * Ensure that we have the required credentials
 * @param {Object} credentials
 * @param {String} credentials.apiKey
 * @param {String} credentials.sessionId
 * @param {String} credentials.token
 */
const validateCredentials = (credentials = []) => {
  const required = ['apiKey', 'sessionId', 'token'];
  required.forEach((credential) => {
    if (!credentials[credential]) {
      throw new CoreError(`${credential} is a required credential`, 'invalidParameters');
    }
  });
};

class AccCore {
  constructor(options) {
    // Options/credentials validation
    if (!options) {
      throw new CoreError('Missing options required for initialization', 'invalidParameters');
    }
    const { credentials } = options;
    validateCredentials(options.credentials);
    this.name = options.name;

    // Init analytics
    this.applicationName = options.applicationName;
    this.analytics = new Analytics(window.location.origin, credentials.sessionId, null, credentials.apiKey);
    this.analytics.log(logAction.init, logVariation.attempt);

    // Create session, setup state
    const sessionProps = options.largeScale ? { connectionEventsSuppressed: true } : undefined;
    this.session = OT.initSession(credentials.apiKey, credentials.sessionId, sessionProps);
    this.internalState = new State();
    this.internalState.setSession(this.session);
    this.internalState.setCredentials(credentials);
    this.internalState.setOptions(options);

    // Individual accelerator packs
    this.communication = null;
    this.textChat = null;
    this.screenSharing = null;
    this.annotation = null;
    this.archiving = null;

    // Create internal event listeners
    this.createEventListeners(this.session, options);

    this.analytics.log(logAction.init, logVariation.success);
  }

  // OpenTok SDK Wrapper
  static OpenTokSDK = OpenTokSDK;

  // Expose utility methods
  static util = util

  /**
   * Get access to an accelerator pack
   * @param {String} packageName - textChat, screenSharing, annotation, or archiving
   * @returns {Object} The instance of the accelerator pack
   */
  getAccPack = (packageName) => {
    const { analytics, textChat, screenSharing, annotation, archiving } = this;
    analytics.log(logAction.getAccPack, logVariation.attempt);
    const packages = {
      textChat,
      screenSharing,
      annotation,
      archiving,
    };
    analytics.log(logAction.getAccPack, logVariation.success);
    return packages[packageName];
  }

  /** Eventing */

  /**
   * Register events that can be listened to be other components/modules
   * @param {array | string} events - A list of event names. A single event may
   * also be passed as a string.
   */
  registerEvents = (events) => {
    const { eventListeners } = this;
    const eventList = Array.isArray(events) ? events : [events];
    eventList.forEach((event) => {
      if (!eventListeners[event]) {
        eventListeners[event] = new Set();
      }
    });
  };

  /**
   * Register a callback for a specific event or pass an object with
   * with event => callback key/value pairs to register listeners for
   * multiple events.
   * @param {String | Object} event - The name of the event
   * @param {Function} callback
   */
  on = (event, callback) => {
    const { eventListeners, on } = this;
    // analytics.log(logAction.on, logVariation.attempt);
    if (typeof event === 'object') {
      Object.keys(event).forEach((eventName) => {
        on(eventName, event[eventName]);
      });
      return;
    }
    const eventCallbacks = eventListeners[event];
    if (!eventCallbacks) {
      message(`${event} is not a registered event.`);
      // analytics.log(logAction.on, logVariation.fail);
    } else {
      eventCallbacks.add(callback);
      // analytics.log(logAction.on, logVariation.success);
    }
  }

  /**
   * Remove a callback for a specific event.  If no parameters are passed,
   * all event listeners will be removed.
   * @param {String} event - The name of the event
   * @param {Function} callback
   */
  off = (event, callback) => {
    const { eventListeners } = this;
    // analytics.log(logAction.off, logVariation.attempt);
    if (!event && !callback) {
      Object.keys(eventListeners).forEach((eventType) => {
        eventListeners[eventType].clear();
      });
    } else {
      const eventCallbacks = eventListeners[event];
      if (!eventCallbacks) {
        // analytics.log(logAction.off, logVariation.fail);
        message(`${event} is not a registered event.`);
      } else {
        eventCallbacks.delete(callback);
        // analytics.log(logAction.off, logVariation.success);
      }
    }
  }

  /**
   * Trigger an event and fire all registered callbacks
   * @param {String} event - The name of the event
   * @param {*} data - Data to be passed to callback functions
   */
  triggerEvent = (event, data) => {
    const { eventListeners, registerEvents } = this;
    const eventCallbacks = eventListeners[event];
    if (!eventCallbacks) {
      registerEvents(event);
      message(`${event} has been registered as a new event.`);
    } else {
      eventCallbacks.forEach(callback => callback(data, event));
    }
  };

  /**
   * Get the current OpenTok session object
   * @returns {Object}
   */
  getSession = () => this.internalState.getSession()


  /**
   * Returns the current OpenTok session credentials
   * @returns {Object}
   */
  getCredentials = () => this.internalState.getCredentials()

  /**
   * Returns the options used for initialization
   * @returns {Object}
   */
  getOptions = () => this.internalState.getOptions()

  createEventListeners = (session, options) => {
    this.eventListeners = {};
    const { registerEvents, internalState, triggerEvent, on, getSession } = this;
    Object.keys(accPackEvents).forEach(type => registerEvents(accPackEvents[type]));

    /**
     * If using screen sharing + annotation in an external window, the screen sharing
     * package will take care of calling annotation.start() and annotation.linkCanvas()
     */
    const usingAnnotation = path('screenSharing.annotation', options);
    const internalAnnotation = usingAnnotation && !path('screenSharing.externalWindow', options);

    /**
     * Wrap session events and update internalState when streams are created
     * or destroyed
     */
    accPackEvents.session.forEach((eventName) => {
      session.on(eventName, (event) => {
        if (eventName === 'streamCreated') { internalState.addStream(event.stream); }
        if (eventName === 'streamDestroyed') { internalState.removeStream(event.stream); }
        triggerEvent(eventName, event);
      });
    });

    if (usingAnnotation) {
      on('subscribeToScreen', ({ subscriber }) => {
        this.annotation.start(getSession())
          .then(() => {
            const absoluteParent = dom.query(path('annotation.absoluteParent.subscriber', options));
            const linkOptions = absoluteParent ? { absoluteParent } : null;
            this.annotation.linkCanvas(subscriber, subscriber.element.parentElement, linkOptions);
          });
      });

      on('unsubscribeFromScreen', () => {
        this.annotation.end();
      });
    }

    on('startScreenSharing', (publisher) => {
      internalState.addPublisher('screen', publisher);
      triggerEvent('startScreenShare', Object.assign({}, { publisher }, internalState.getPubSub()));
      if (internalAnnotation) {
        this.annotation.start(getSession())
          .then(() => {
            const absoluteParent = dom.query(path('annotation.absoluteParent.publisher', options));
            const linkOptions = absoluteParent ? { absoluteParent } : null;
            this.annotation.linkCanvas(publisher, publisher.element.parentElement, linkOptions);
          });
      }
    });

    on('endScreenSharing', (publisher) => {
      // delete publishers.screen[publisher.id];
      internalState.removePublisher('screen', publisher);
      triggerEvent('endScreenShare', internalState.getPubSub());
      if (usingAnnotation) {
        this.annotation.end();
      }
    });
  }

  setupExternalAnnotation = () => this.annotation.start(this.getSession(), { screensharing: true })

  linkAnnotation = (pubSub, annotationContainer, externalWindow) => {
    const { annotation, internalState } = this;
    annotation.linkCanvas(pubSub, annotationContainer, {
      externalWindow,
    });

    if (externalWindow) {
      // Add subscribers to the external window
      const streams = internalState.getStreams();
      const cameraStreams = Object.keys(streams).reduce((acc, streamId) => {
        const stream = streams[streamId];
        return stream.videoType === 'camera' || stream.videoType === 'sip' ? acc.concat(stream) : acc;
      }, []);
      cameraStreams.forEach(annotation.addSubscriberToExternalWindow);
    }
  }

  initPackages = () => {
    const { analytics, getSession, getOptions, internalState } = this;
    const { on, registerEvents, setupExternalAnnotation, triggerEvent, linkAnnotation } = this;
    analytics.log(logAction.initPackages, logVariation.attempt);
    const session = getSession();
    const options = getOptions();
    /**
     * Try to require a package.  If 'require' is unavailable, look for
     * the package in global scope.  A switch ttatement is used because
     * webpack and Browserify aren't able to resolve require statements
     * that use variable names.
     * @param {String} packageName - The name of the npm package
     * @param {String} globalName - The name of the package if exposed on global/window
     * @returns {Object}
     */
    const optionalRequire = (packageName, globalName) => {
      let result;
      /* eslint-disable global-require, import/no-extraneous-dependencies, import/no-unresolved */
      try {
        switch (packageName) {
          case 'opentok-text-chat':
            result = require('opentok-text-chat');
            break;
          case 'opentok-screen-sharing':
            result = require('opentok-screen-sharing');
            break;
          case 'opentok-annotation':
            result = require('opentok-annotation');
            break;
          case 'opentok-archiving':
            result = require('opentok-archiving');
            break;
          default:
            break;
        }
        /* eslint-enable global-require */
      } catch (error) {
        result = window[globalName];
      }
      if (!result) {
        analytics.log(logAction.initPackages, logVariation.fail);
        throw new CoreError(`Could not load ${packageName}`, 'missingDependency');
      }
      return result;
    };

    const availablePackages = {
      textChat() {
        return optionalRequire('opentok-text-chat', 'TextChatAccPack');
      },
      screenSharing() {
        return optionalRequire('opentok-screen-sharing', 'ScreenSharingAccPack');
      },
      annotation() {
        return optionalRequire('opentok-annotation', 'AnnotationAccPack');
      },
      archiving() {
        return optionalRequire('opentok-archiving', 'ArchivingAccPack');
      },
    };

    const packages = {};
    (path('packages', options) || []).forEach((acceleratorPack) => {
      if (availablePackages[acceleratorPack]) { // eslint-disable-next-line no-param-reassign
        packages[properCase(acceleratorPack)] = availablePackages[acceleratorPack]();
      } else {
        message(`${acceleratorPack} is not a valid accelerator pack`);
      }
    });

    /**
     * Get containers for streams, controls, and the chat widget
     */
    const getDefaultContainer = pubSub => document.getElementById(`${pubSub}Container`);
    const getContainerElements = () => {
      // Need to use path to check for null values
      const controls = pathOr('#videoControls', 'controlsContainer', options);
      const chat = pathOr('#chat', 'textChat.container', options);
      const stream = pathOr(getDefaultContainer, 'streamContainers', options);
      return { stream, controls, chat };
    };
    /** *** *** *** *** */


    /**
     * Return options for the specified package
     * @param {String} packageName
     * @returns {Object}
     */
    const packageOptions = (packageName) => {
      /**
       * Methods to expose to accelerator packs
       */
      const accPack = {
        registerEventListener: on, // Legacy option
        on,
        registerEvents,
        triggerEvent,
        setupExternalAnnotation,
        linkAnnotation,
      };

      /**
       * If options.controlsContainer/containers.controls is null,
       * accelerator packs should not append their controls.
       */
      const containers = getContainerElements();
      const appendControl = !!containers.controls;
      const controlsContainer = containers.controls; // Legacy option
      const streamContainers = containers.stream;
      const baseOptions = {
        session,
        core: accPack,
        accPack,
        controlsContainer,
        appendControl,
        streamContainers,
      };

      switch (packageName) {
        /* beautify ignore:start */
        case 'communication': {
          return Object.assign({}, baseOptions, { state: internalState, analytics }, options.communication);
        }
        case 'textChat': {
          const textChatOptions = {
            textChatContainer: path('textChat.container', options),
            waitingMessage: path('textChat.waitingMessage', options),
            sender: { alias: path('textChat.name', options) },
            alwaysOpen: path('textChat.alwaysOpen', options),
          };
          return Object.assign({}, baseOptions, textChatOptions);
        }
        case 'screenSharing': {
          const screenSharingContainer = { screenSharingContainer: streamContainers };
          return Object.assign({}, baseOptions, screenSharingContainer, options.screenSharing);
        }
        case 'annotation': {
          return Object.assign({}, baseOptions, options.annotation);
        }
        case 'archiving': {
          return Object.assign({}, baseOptions, options.archiving);
        }
        default:
          return {};
        /* beautify ignore:end */
      }
    };

    /** Create instances of each package */
    // eslint-disable-next-line global-require,import/no-extraneous-dependencies

    this.communication = new Communication(packageOptions('communication'));
    this.textChat = packages.TextChat ? new packages.TextChat(packageOptions('textChat')) : null;
    this.screenSharing = packages.ScreenSharing ? new packages.ScreenSharing(packageOptions('screenSharing')) : null;
    this.annotation = packages.Annotation ? new packages.Annotation(packageOptions('annotation')) : null;
    this.archiving = packages.Archiving ? new packages.Archiving(packageOptions('archiving')) : null;

    analytics.log(logAction.initPackages, logVariation.success);
  }

  /**
   * Connect to the session
   * @returns {Promise} <resolve: -, reject: Error>
   */
  connect = () => {
    const { analytics, getSession, initPackages, triggerEvent, getCredentials } = this;
    return new Promise((resolve, reject) => {
      analytics.log(logAction.connect, logVariation.attempt);
      const session = getSession();
      const { token } = getCredentials();
      session.connect(token, (error) => {
        if (error) {
          message(error);
          analytics.log(logAction.connect, logVariation.fail);
          return reject(error);
        }
        const { sessionId, apiKey } = session;
        analytics.update(sessionId, path('connection.connectionId', session), apiKey);
        analytics.log(logAction.connect, logVariation.success);
        initPackages();
        triggerEvent('connected', session);
        return resolve({ connections: session.connections.length() });
      });
    });
  }

  /**
   * Disconnect from the session
   * @returns {Promise} <resolve: -, reject: Error>
   */
  disconnect = () => {
    const { analytics, getSession, internalState } = this;
    analytics.log(logAction.disconnect, logVariation.attempt);
    getSession().disconnect();
    internalState.reset();
    analytics.log(logAction.disconnect, logVariation.success);
  };

  /**
   * Force a remote connection to leave the session
   * @param {Object} connection
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  forceDisconnect = (connection) => {
    const { analytics, getSession } = this;
    return new Promise((resolve, reject) => {
      analytics.log(logAction.forceDisconnect, logVariation.attempt);
      getSession().forceDisconnect(connection, (error) => {
        if (error) {
          analytics.log(logAction.forceDisconnect, logVariation.fail);
          reject(error);
        } else {
          analytics.log(logAction.forceDisconnect, logVariation.success);
          resolve();
        }
      });
    });
  }

  /**
   * Start publishing video and subscribing to streams
   * @param {Object} publisherProps - https://goo.gl/0mL0Eo
   * @returns {Promise} <resolve: State + Publisher, reject: Error>
   */
  startCall = publisherProps => this.communication.startCall(publisherProps)

  /**
   * Stop all publishing un unsubscribe from all streams
   * @returns {void}
   */
  endCall = () => this.communication.endCall()

  /**
   * Start publishing video and subscribing to streams
   * @returns {Object} The internal state of the core session
   */
  state = () => this.internalState.all();

  /**
   * Manually subscribe to a stream
   * @param {Object} stream - An OpenTok stream
   * @param {Object} [subscriberProperties] - https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
   * @param {Boolean} [networkTest] - Subscribing to our own publisher as part of a network test?
   * @returns {Promise} <resolve: Subscriber, reject: Error>
   */
  subscribe = (stream, subscriberProperties, networkTest = false) =>
    this.communication.subscribe(stream, subscriberProperties, networkTest)

  /**
   * Manually unsubscribe from a stream
   * @param {Object} subscriber - An OpenTok subscriber object
   * @returns {Promise} <resolve: void, reject: Error>
   */
  unsubscribe = subscriber => this.communication.unsubscribe(subscriber)

  /**
   * Force the publisher of a stream to stop publishing the stream
   * @param {Object} stream
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  forceUnpublish = (stream) => {
    const { analytics, getSession } = this;
    return new Promise((resolve, reject) => {
      analytics.log(logAction.forceUnpublish, logVariation.attempt);
      getSession().forceUnpublish(stream, (error) => {
        if (error) {
          analytics.log(logAction.forceUnpublish, logVariation.fail);
          reject(error);
        } else {
          analytics.log(logAction.forceUnpublish, logVariation.success);
          resolve();
        }
      });
    });
  }

  /**
   * Get the local publisher object for a stream
   * @param {Object} stream - An OpenTok stream object
   * @returns {Object} - The publisher object
   */
  getPublisherForStream = stream => this.getSession().getPublisherForStream(stream);

  /**
   * Get the local subscriber objects for a stream
   * @param {Object} stream - An OpenTok stream object
   * @returns {Array} - An array of subscriber object
   */
  getSubscribersForStream = stream => this.getSession().getSubscribersForStream(stream);


  /**
   * Send a signal using the OpenTok signaling apiKey
   * @param {String} type
   * @param {*} [data]
   * @param {Object} [to] - An OpenTok connection object
   * @returns {Promise} <resolve: empty, reject: Error>
   */
  signal = (type, data, to) => {
    const { analytics, getSession } = this;
    return new Promise((resolve, reject) => {
      analytics.log(logAction.signal, logVariation.attempt);
      const session = getSession();
      const signalObj = Object.assign({},
        type ? { type } : null,
        data ? { data: JSON.stringify(data) } : null,
        to ? { to } : null // eslint-disable-line comma-dangle
      );
      session.signal(signalObj, (error) => {
        if (error) {
          analytics.log(logAction.signal, logVariation.fail);
          reject(error);
        } else {
          analytics.log(logAction.signal, logVariation.success);
          resolve();
        }
      });
    });
  }

  /**
   * Enable or disable local audio
   * @param {Boolean} enable
   */
  toggleLocalAudio = (enable) => {
    const { analytics, internalState, communication } = this;
    analytics.log(logAction.toggleLocalAudio, logVariation.attempt);
    const { publishers } = internalState.getPubSub();
    const toggleAudio = id => communication.enableLocalAV(id, 'audio', enable);
    Object.keys(publishers.camera).forEach(toggleAudio);
    analytics.log(logAction.toggleLocalAudio, logVariation.success);
  };

  /**
   * Enable or disable local video
   * @param {Boolean} enable
   */
  toggleLocalVideo = (enable) => {
    const { analytics, internalState, communication } = this;
    analytics.log(logAction.toggleLocalVideo, logVariation.attempt);
    const { publishers } = internalState.getPubSub();
    const toggleVideo = id => communication.enableLocalAV(id, 'video', enable);
    Object.keys(publishers.camera).forEach(toggleVideo);
    analytics.log(logAction.toggleLocalVideo, logVariation.success);
  };

  /**
   * Enable or disable remote audio
   * @param {String} id - Subscriber id
   * @param {Boolean} enable
   */
  toggleRemoteAudio = (id, enable) => {
    const { analytics, communication } = this;
    analytics.log(logAction.toggleRemoteAudio, logVariation.attempt);
    communication.enableRemoteAV(id, 'audio', enable);
    analytics.log(logAction.toggleRemoteAudio, logVariation.success);
  };

  /**
   * Enable or disable remote video
   * @param {String} id - Subscriber id
   * @param {Boolean} enable
   */
  toggleRemoteVideo = (id, enable) => {
    const { analytics, communication } = this;
    analytics.log(logAction.toggleRemoteVideo, logVariation.attempt);
    communication.enableRemoteAV(id, 'video', enable);
    analytics.log(logAction.toggleRemoteVideo, logVariation.success);
  }

}

if (global === window) {
  window.AccCore = AccCore;
}

module.exports = AccCore;
