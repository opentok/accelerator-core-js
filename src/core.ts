import OpenTokSDK from './sdk-wrapper/sdkWrapper';

import Analytics from './analytics';
import Communication from './communication';
import { CoreEvents, LogAction, LogVariation } from './enums';
import {
  CoreOptions,
  Credential,
  EndScreenShareEvent,
  StartScreenShareEvent,
  StreamType
} from './models';
import { acceleratorEvents } from './constants';
import { dom, message, path, properCase } from './utils';

export default class AccCore {
  public OpenTokSDK: OpenTokSDK;
  public analytics: Analytics;
  public communication: Communication;
  public textChat: any;
  public screenSharing: any;
  public annotation: any;
  public archiving: any;

  public eventListeners: Record<string, Set<(event: unknown) => void>>;

  constructor(options: CoreOptions) {
    this.OpenTokSDK = new OpenTokSDK(
      options ? options.credentials : null,
      options.largeScale ? { connectionEventsSuppressed: true } : undefined
    );

    // Initialize analytics
    this.analytics = new Analytics(
      window.location.origin,
      options.credentials.sessionId,
      null,
      options.credentials.apiKey,
      options.applicationName
    );
    this.analytics.log(LogAction.init, LogVariation.attempt);

    // save options
    this.OpenTokSDK.setOptions(options);

    // Create internal event listeners
    this.createEventListeners();

    this.analytics.log(LogAction.init, LogVariation.success);
  }

  /**
   * Connect to the session
   */
  async connect(): Promise<void> {
    this.analytics.log(LogAction.connect, LogVariation.attempt);

    try {
      await this.OpenTokSDK.connect();

      const session = this.getSession();
      const credentials = this.getCredentials();

      this.analytics.update(
        credentials.sessionId,
        session.connection.connectionId,
        credentials.apiKey
      );

      this.analytics.log(LogAction.connect, LogVariation.success);

      this.initPackages();
      this.triggerEvent('connected', session);
    } catch (error: unknown) {
      message(error as string);
      this.analytics.log(LogAction.connect, LogVariation.fail);
      throw new Error(error as string);
    }
  }

  /**
   * Gets the current session
   */
  public getSession = (): OT.Session => this.OpenTokSDK.getSession();

  /**
   * Gets the current credentials
   */
  public getCredentials = (): Credential => this.OpenTokSDK.getCredentials();

  /**
   * Gets the current options
   */
  public getOptions = (): CoreOptions => this.OpenTokSDK.getOptions();

  /**
   * Register a callback for a specific event or pass an object with
   * with event => callback key/value pairs to register listeners for
   * multiple events.
   * @param event The name of the event
   * @param callback
   */
  on = (event: string | unknown, callback: (event: unknown) => void): void => {
    if (typeof event !== 'string') {
      Object.keys(event).forEach((eventName) => {
        this.on(eventName, event[eventName]);
      });
      return;
    }
    const eventCallbacks = this.eventListeners[event];
    if (!eventCallbacks) {
      message(`${event} is not a registered event.`);
    } else {
      eventCallbacks.add(callback);
    }
  };

  /**
   * Remove a callback for a specific event.  If no parameters are passed,
   * all event listeners will be removed.
   * @param event - The name of the event
   * @param callback
   */
  off = (event: string, callback: (event: unknown) => void): void => {
    const { eventListeners } = this;
    if (!event && !callback) {
      Object.keys(eventListeners).forEach((eventType) => {
        eventListeners[eventType].clear();
      });
    } else {
      const eventCallbacks = eventListeners[event];
      if (!eventCallbacks) {
        message(`${event} is not a registered event.`);
      } else {
        eventCallbacks.delete(callback);
      }
    }
  };

  /**
   * Establishes all events we could be listening to and
   * any callbacks that should occur.
   */
  private createEventListeners = (): void => {
    this.eventListeners = {};

    Object.keys(acceleratorEvents).forEach((type) =>
      this.registerEvents(acceleratorEvents[type])
    );

    const options = this.OpenTokSDK.getOptions();
    const session = this.OpenTokSDK.getSession();

    /**
     * If using screen sharing + annotation in an external window, the screen sharing
     * package will take care of calling annotation.start() and annotation.linkCanvas()
     */
    const usingAnnotation: boolean =
      options.screenSharing && options.screenSharing.annotation;
    const internalAnnotation: boolean =
      usingAnnotation && options.screenSharing.externalWindow;

    /**
     * Wrap session events and update internalState when streams are created
     * or destroyed
     */
    acceleratorEvents.session.forEach((eventName: string) => {
      session.on(eventName, (event) => {
        const stream = event.target.stream as OT.Stream;
        if (eventName === 'streamCreated') {
          this.OpenTokSDK.addStream(stream);
        }
        if (eventName === 'streamDestroyed') {
          this.OpenTokSDK.removeStream(stream);
        }
        this.triggerEvent(eventName, event);
      });
    });

    /**
     *
     */
    if (usingAnnotation) {
      this.on('subscribeToScreen', ({ subscriber }) => {
        this.annotation.start(session).then(() => {
          if (
            options.annotation &&
            options.annotation.absoluteParent &&
            options.annotation.absoluteParent.subscriber
          ) {
            const absoluteParent = dom.query(
              options.annotation.absoluteParent.subscriber
            );
            const linkOptions = absoluteParent ? { absoluteParent } : null;
            this.annotation.linkCanvas(
              subscriber,
              subscriber.element.parentElement,
              linkOptions
            );
          }
        });
      });

      this.on('unsubscribeFromScreen', () => {
        this.annotation.end();
      });
    }

    this.on('startScreenSharing', (publisher: OT.Publisher) => {
      this.OpenTokSDK.addPublisher(StreamType.Screen, publisher);
      this.triggerEvent(
        CoreEvents.StartScreenShare,
        new StartScreenShareEvent(publisher, this.OpenTokSDK.getPubSub())
      );

      if (internalAnnotation) {
        this.annotation.start(session).then(() => {
          if (
            options.annotation &&
            options.annotation.absoluteParent &&
            options.annotation.absoluteParent.publisher
          ) {
            const absoluteParent = dom.query(
              options.annotation.absoluteParent.publisher
            );
            const linkOptions = absoluteParent ? { absoluteParent } : null;
            this.annotation.linkCanvas(
              publisher,
              publisher.element.parentElement,
              linkOptions
            );
          }
        });
      }
    });

    this.on('endScreenSharing', (publisher: OT.Publisher) => {
      this.OpenTokSDK.removePublisher(StreamType.Screen, publisher);
      this.triggerEvent(
        CoreEvents.EndScreenShare,
        new EndScreenShareEvent(this.OpenTokSDK.getPubSub())
      );
      if (usingAnnotation) {
        this.annotation.end();
      }
    });
  };

  /**
   * Register events that can be listened to be other components/modules
   * @param events A list of event names. A single event may
   * also be passed as a string.
   */
  registerEvents = (events: string | string[]): void => {
    const eventList = Array.isArray(events) ? events : [events];
    eventList.forEach((event) => {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = new Set();
      }
    });
  };

  /**
   * Trigger an event and fire all registered callbacks
   * @param event The name of the event
   * @param data Data to be passed to callback functions
   */
  triggerEvent = (event: string, data: unknown): void => {
    const eventCallbacks = this.eventListeners[event];
    if (!eventCallbacks) {
      this.registerEvents(event);
      message(`${event} has been registered as a new event.`);
    } else {
      eventCallbacks.forEach((callback) => callback(data, event));
    }
  };

  initPackages = (): void => {
    this.analytics.log(LogAction.initPackages, LogVariation.attempt);

    const session = this.getSession();
    const options = this.getOptions();

    /**
     * Try to require a package.  If 'require' is unavailable, look for
     * the package in global scope.  A switch statement is used because
     * webpack and Browserify aren't able to resolve require statements
     * that use variable names.
     * @param packageName The name of the npm package
     * @param globalName The name of the package if exposed on global/window
     */
    const optionalRequire = (
      packageName: string,
      globalName: string
    ): unknown => {
      let result;
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
      } catch (error) {
        result = window[globalName];
      }
      if (!result) {
        this.analytics.log(LogAction.initPackages, LogVariation.fail);
        throw new SDKError(
          'otAccCore',
          `Could not load ${packageName}`,
          'missingDependency'
        );
      }
      return result;
    };

    const availablePackages = {
      textChat() {
        return optionalRequire('opentok-text-chat', 'TextChatAccPack');
      },
      screenSharing() {
        return optionalRequire(
          'opentok-screen-sharing',
          'ScreenSharingAccPack'
        );
      },
      annotation() {
        return optionalRequire('opentok-annotation', 'AnnotationAccPack');
      },
      archiving() {
        return optionalRequire('opentok-archiving', 'ArchivingAccPack');
      }
    };

    const packages = {};
    (options.packages || []).forEach((acceleratorPack) => {
      if (availablePackages[acceleratorPack]) {
        // eslint-disable-next-line no-param-reassign
        packages[properCase(acceleratorPack)] = availablePackages[
          acceleratorPack
        ]();
      } else {
        message(`${acceleratorPack} is not a valid accelerator pack`);
      }
    });

    /**
     * Get containers for streams, controls, and the chat widget
     */
    const getDefaultContainer = (pubSub) =>
      document.getElementById(`${pubSub}Container`);
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
        linkAnnotation
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
        streamContainers
      };

      switch (packageName) {
        /* beautify ignore:start */
        case 'communication': {
          return Object.assign(
            {},
            baseOptions,
            { state: internalState, analytics },
            options.communication
          );
        }
        case 'textChat': {
          const textChatOptions = {
            textChatContainer: path('textChat.container', options),
            waitingMessage: path('textChat.waitingMessage', options),
            sender: { alias: path('textChat.name', options) },
            alwaysOpen: path('textChat.alwaysOpen', options)
          };
          return Object.assign({}, baseOptions, textChatOptions);
        }
        case 'screenSharing': {
          const screenSharingContainer = {
            screenSharingContainer: streamContainers
          };
          return Object.assign(
            {},
            baseOptions,
            screenSharingContainer,
            options.screenSharing
          );
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
    this.textChat = packages.TextChat
      ? new packages.TextChat(packageOptions('textChat'))
      : null;
    this.screenSharing = packages.ScreenSharing
      ? new packages.ScreenSharing(packageOptions('screenSharing'))
      : null;
    this.annotation = packages.Annotation
      ? new packages.Annotation(packageOptions('annotation'))
      : null;
    this.archiving = packages.Archiving
      ? new packages.Archiving(packageOptions('archiving'))
      : null;

    analytics.log(logAction.initPackages, logVariation.success);
  };

  setupExternalAnnotation = (): void =>
    this.annotation.start(this.OpenTokSDK.getSession(), {
      screensharing: true
    });

  linkAnnotation = (pubSub, annotationContainer, externalWindow): void => {
    this.annotation.linkCanvas(pubSub, annotationContainer, {
      externalWindow
    });

    if (externalWindow) {
      // Add subscribers to the external window
      const streams = this.OpenTokSDK.getStreams();
      const cameraStreams = Object.keys(streams).reduce((acc, streamId) => {
        const stream = streams[streamId];
        return (stream.videoType as StreamType) === StreamType.Camera ||
          (stream.videoType as StreamType) === StreamType.SIP
          ? acc.concat(stream)
          : acc;
      }, []);
      cameraStreams.forEach(this.annotation.addSubscriberToExternalWindow);
    }
  };

  // Expose utility methods
  static util = util;

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
      archiving
    };
    analytics.log(logAction.getAccPack, logVariation.success);
    return packages[packageName];
  };

  /** Eventing */

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
  };

  /**
   * Start publishing video and subscribing to streams
   * @param {Object} publisherProps - https://goo.gl/0mL0Eo
   * @returns {Promise} <resolve: State + Publisher, reject: Error>
   */
  startCall = (publisherProps) => this.communication.startCall(publisherProps);

  /**
   * Stop all publishing un unsubscribe from all streams
   * @returns {void}
   */
  endCall = () => this.communication.endCall();

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
    this.communication.subscribe(stream, subscriberProperties, networkTest);

  /**
   * Manually unsubscribe from a stream
   * @param {Object} subscriber - An OpenTok subscriber object
   * @returns {Promise} <resolve: void, reject: Error>
   */
  unsubscribe = (subscriber) => this.communication.unsubscribe(subscriber);

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
  };

  /**
   * Get the local publisher object for a stream
   * @param {Object} stream - An OpenTok stream object
   * @returns {Object} - The publisher object
   */
  getPublisherForStream = (stream) =>
    this.getSession().getPublisherForStream(stream);

  /**
   * Get the local subscriber objects for a stream
   * @param {Object} stream - An OpenTok stream object
   * @returns {Array} - An array of subscriber object
   */
  getSubscribersForStream = (stream) =>
    this.getSession().getSubscribersForStream(stream);

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
      const signalObj = Object.assign(
        {},
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
  };

  /**
   * Enable or disable local audio
   * @param {Boolean} enable
   */
  toggleLocalAudio = (enable) => {
    const { analytics, internalState, communication } = this;
    analytics.log(logAction.toggleLocalAudio, logVariation.attempt);
    const { publishers } = internalState.getPubSub();
    const toggleAudio = (id) =>
      communication.enableLocalAV(id, 'audio', enable);
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
    const toggleVideo = (id) =>
      communication.enableLocalAV(id, 'video', enable);
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
  };
}

if (global === window) {
  window.AccCore = AccCore;
}

module.exports = AccCore;
