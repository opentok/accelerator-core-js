import { OpenTokSDK } from './sdk-wrapper/sdkWrapper';

import { Analytics } from './analytics';
import { Communication } from './communication';
import {
  CoreEvents,
  LogAction,
  LogVariation,
  Packages,
  ScreenSharingEvents
} from './enums';
import {
  IAnnotation,
  CommunicationOptions,
  CoreOptions,
  Credential,
  EndScreenShareEvent,
  PubSubDetail,
  StartScreenShareEvent,
  StreamType,
  SubscribeToScreenEvent,
  ITextChat,
  IScreenSharing,
  IArchiving
} from './models';
import { acceleratorEvents } from './constants';
import { dom, message, path, pathOr, properCase } from './utils';
import { AcceleratorPackages } from './models/acceleratorPackages';
import { SDKError } from './sdk-wrapper/errors';
import { LinkCanvasOptions } from './models/accelerator-packs/annotation/linkCanvasOptions';

export class AccCore {
  public OpenTokSDK: OpenTokSDK;
  public analytics: Analytics;
  public communication: Communication;
  public textChat: ITextChat;
  public screenSharing: IScreenSharing;
  public annotation: IAnnotation;
  public archiving: IArchiving;

  static utils = { dom, message, path, pathOr, properCase };

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

    this.analytics.log(LogAction.init, LogVariation.success);
  }

  /**
   * Connect to the session
   */
  connect = async (): Promise<void> => {
    this.analytics.log(LogAction.connect, LogVariation.attempt);

    try {
      await this.OpenTokSDK.connect();

      // Create internal event listeners
      this.createEventListeners();

      const session = this.getSession();
      const credentials = this.getCredentials();

      this.analytics.update(
        credentials.sessionId,
        session.connection.connectionId,
        credentials.apiKey
      );

      this.analytics.log(LogAction.connect, LogVariation.success);

      this.initPackages();
      this.triggerEvent(CoreEvents.Connected, session);
    } catch (error: unknown) {
      message(error as string);
      this.analytics.log(LogAction.connect, LogVariation.fail);
      throw new Error(error as string);
    }
  };

  /**
   * Gets the current session
   */
  getSession = (): OT.Session => this.OpenTokSDK.getSession();

  /**
   * Gets the current credentials
   */
  getCredentials = (): Credential => this.OpenTokSDK.getCredentials();

  /**
   * Gets the current options
   */
  getOptions = (): CoreOptions => this.OpenTokSDK.getOptions();

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
    if (!this.eventListeners[event]) {
      message(`${event} is not a registered event.`);
    } else {
      this.eventListeners[event].add(callback);
    }
  };

  /**
   * Remove a callback for a specific event.  If no parameters are passed,
   * all event listeners will be removed.
   * @param event - The name of the event
   * @param callback
   */
  off = (event: string, callback: (event: unknown) => void): void => {
    if (!event && !callback) {
      Object.keys(this.eventListeners).forEach((eventType) => {
        this.eventListeners[eventType].clear();
      });
    } else {
      if (!this.eventListeners[event]) {
        message(`${event} is not a registered event.`);
      } else {
        this.eventListeners[event].delete(callback);
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
      this.OpenTokSDK.on(eventName, (data) => {
        this.triggerEvent(eventName, data);
      });
    });

    /**
     *
     */
    if (usingAnnotation) {
      this.on(
        CoreEvents.StartScreenShare,
        (subscribeToScreenEvent: SubscribeToScreenEvent) => {
          this.annotation.start(session).then(() => {
            if (
              options.annotation &&
              options.annotation.absoluteParent &&
              options.annotation.absoluteParent.subscriber
            ) {
              const absoluteParent = dom.query(
                options.annotation.absoluteParent.subscriber
              ) as HTMLElement | undefined;
              const linkOptions = absoluteParent ? { absoluteParent } : null;
              const subscriber = subscribeToScreenEvent.subscriber;
              this.annotation.linkCanvas(
                subscriber,
                subscriber.element.parentElement,
                linkOptions
              );
            }
          });
        }
      );

      this.on(CoreEvents.EndScreenShare, () => {
        this.annotation.end();
      });
    }

    this.on(
      ScreenSharingEvents.StartScreensharing,
      (publisher: OT.Publisher) => {
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
              ) as HTMLElement | undefined;
              const linkOptions = absoluteParent ? { absoluteParent } : null;
              this.annotation.linkCanvas(
                publisher,
                publisher.element.parentElement,
                linkOptions
              );
            }
          });
        }
      }
    );

    this.on(ScreenSharingEvents.EndScreenSharing, (publisher: OT.Publisher) => {
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
      eventCallbacks.forEach((callback) => callback(data));
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
    ): (() => void) => {
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

    const packages = new AcceleratorPackages();
    (options.packages || []).forEach((acceleratorPack) => {
      if (availablePackages[acceleratorPack]) {
        const accPack = availablePackages[acceleratorPack] as () => void;
        packages[properCase(acceleratorPack)] = accPack();
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
      const controls = options.controlsContainer || '#videoControls';
      const chat = (options.textChat && options.textChat.container) || '#chat';
      const stream = options.streamContainers || getDefaultContainer;
      return { stream, controls, chat };
    };

    /**
     * Return options for the specified package
     * @param packageName
     */
    const packageOptions = (packageName: string): unknown => {
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
        core: this,
        controlsContainer,
        appendControl,
        streamContainers
      };

      switch (packageName) {
        case Packages.Annotation: {
          return Object.assign({}, baseOptions, options.annotation);
        }
        case Packages.Archiving: {
          return Object.assign({}, baseOptions, options.archiving);
        }
        case Packages.Communication: {
          return new CommunicationOptions(
            this.analytics,
            this,
            session,
            appendControl,
            controlsContainer as string,
            options.communication,
            streamContainers
          );
        }
        case Packages.ScreenSharing: {
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
        case Packages.TextChat: {
          const textChatOptions = {
            textChatContainer:
              (options.textChat && options.textChat.container) || undefined,
            waitingMessage:
              (options.textChat && options.textChat.waitingMessage) ||
              undefined,
            sender: {
              alias: (options.textChat && options.textChat.name) || undefined
            },
            alwaysOpen:
              (options.textChat && options.textChat.alwaysOpen) || undefined
          };
          return Object.assign({}, baseOptions, textChatOptions);
        }
        default:
          return {};
      }
    };

    /** Create instances of each package */

    this.communication = new Communication(
      packageOptions('communication') as CommunicationOptions
    );
    this.textChat = packages.TextChat
      ? packages.TextChat(packageOptions('textChat'))
      : null;
    this.screenSharing = packages.ScreenSharing
      ? packages.ScreenSharing(packageOptions('screenSharing'))
      : null;
    this.annotation = packages.Annotation
      ? packages.Annotation(packageOptions('annotation'))
      : null;
    this.archiving = packages.Archiving
      ? packages.Archiving(packageOptions('archiving'))
      : null;

    this.analytics.log(LogAction.initPackages, LogVariation.success);
  };

  setupExternalAnnotation = async (): Promise<void> =>
    await this.annotation.start(this.OpenTokSDK.getSession(), {
      screensharing: true
    });

  linkAnnotation = (
    pubSub: OT.Publisher | OT.Subscriber,
    annotationContainer: HTMLElement,
    externalWindow: string | HTMLElement
  ): void => {
    this.annotation.linkCanvas(
      pubSub,
      annotationContainer,
      new LinkCanvasOptions(externalWindow)
    );

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

  /**
   * Get access to an accelerator pack
   * @param packageName textChat, screenSharing, annotation, or archiving
   */
  getAccPack = (packageName: Packages): unknown => {
    this.analytics.log(LogAction.getAccPack, LogVariation.attempt);
    const packages = {
      textChat: this.textChat,
      screenSharing: this.screenSharing,
      annotation: this.annotation,
      archiving: this.archiving
    };
    this.analytics.log(LogAction.getAccPack, LogVariation.success);
    return packages[packageName];
  };

  /**
   * Disconnect from the session
   * @returns {Promise} <resolve: -, reject: Error>
   */
  disconnect = (): void => {
    this.analytics.log(LogAction.disconnect, LogVariation.attempt);
    this.OpenTokSDK.disconnect();
    this.analytics.log(LogAction.disconnect, LogVariation.success);
  };

  /**
   * Force a remote connection to leave the session
   * @param connection
   */
  forceDisconnect = async (connection: OT.Connection): Promise<void> => {
    this.analytics.log(LogAction.forceDisconnect, LogVariation.attempt);
    try {
      await this.OpenTokSDK.forceDisconnect(connection);
      this.analytics.log(LogAction.forceDisconnect, LogVariation.success);
    } catch (error) {
      this.analytics.log(LogAction.forceDisconnect, LogVariation.fail);
      throw error;
    }
  };

  /**
   * Start publishing video and subscribing to streams
   * @param publisherProperties
   * @see https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
   */
  startCall = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<PubSubDetail & { publisher: OT.Publisher }> =>
    await this.communication.startCall(publisherProperties);

  /**
   * Stop all publishing un unsubscribe from all streams
   */
  endCall = async (): Promise<void> => await this.communication.endCall();

  /**
   * Retrieve current state of session
   */
  state = (): unknown => this.OpenTokSDK.all();

  /**
   * Manually subscribe to a stream
   * @param stream An OpenTok stream
   * @param subscriberProperties
   * @param networkTest Subscribing to our own publisher as part of a network test?
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
   */
  subscribe = async (
    stream: OT.Stream,
    subscriberProperties: OT.SubscriberProperties,
    networkTest = false
  ): Promise<OT.Subscriber> =>
    this.communication.subscribe(stream, subscriberProperties, networkTest);

  /**
   * Manually unsubscribe from a stream
   * @param subscriber An OpenTok subscriber object
   */
  unsubscribe = async (subscriber: OT.Subscriber): Promise<void> =>
    await this.communication.unsubscribe(subscriber);

  /**
   * Force the publisher of a stream to stop publishing the stream
   * @param stream An OpenTok stream object
   */
  forceUnpublish = async (stream: OT.Stream): Promise<void> => {
    this.analytics.log(LogAction.forceUnpublish, LogVariation.attempt);
    try {
      await this.OpenTokSDK.forceUnpublish(stream);
      this.analytics.log(LogAction.forceUnpublish, LogVariation.success);
    } catch (error) {
      this.analytics.log(LogAction.forceUnpublish, LogVariation.fail);
      throw error;
    }
  };

  /**
   * Get the local publisher object for a stream
   * @param stream An OpenTok stream object
   */
  getPublisherForStream = (stream: OT.Stream): OT.Publisher =>
    this.getSession().getPublisherForStream(stream);

  /**
   * Get the local subscriber objects for a stream
   * @param stream An OpenTok stream object
   */
  getSubscribersForStream = (stream: OT.Stream): [OT.Subscriber] =>
    this.getSession().getSubscribersForStream(stream);

  /**
   * Send a signal using the OpenTok signaling apiKey
   * @param type
   * @param data
   * @param to An OpenTok connection object
   */
  signal = async (
    type: string,
    data: unknown,
    to: OT.Connection
  ): Promise<void> => {
    this.analytics.log(LogAction.signal, LogVariation.attempt);
    try {
      await this.OpenTokSDK.signal(type, data, to);
      this.analytics.log(LogAction.signal, LogVariation.success);
    } catch (error) {
      this.analytics.log(LogAction.signal, LogVariation.fail);
      throw error;
    }
  };

  /**
   * Enable or disable local audio
   * @param enable
   */
  toggleLocalAudio = (enable: boolean): void => {
    this.analytics.log(LogAction.toggleLocalAudio, LogVariation.attempt);
    const { publishers } = this.OpenTokSDK.getPubSub();

    const toggleAudio = (id) =>
      this.communication.enableLocalAV(id, 'audio', enable);

    Object.keys(publishers.camera).forEach(toggleAudio);
    Object.keys(publishers.screen).forEach(toggleAudio);
    Object.keys(publishers.sip).forEach(toggleAudio);
    this.analytics.log(LogAction.toggleLocalAudio, LogVariation.success);
  };

  /**
   * Enable or disable local video
   * @param enable
   */
  toggleLocalVideo = (enable: boolean): void => {
    this.analytics.log(LogAction.toggleLocalVideo, LogVariation.attempt);
    const { publishers } = this.OpenTokSDK.getPubSub();
    const toggleVideo = (id) =>
      this.communication.enableLocalAV(id, 'video', enable);
    Object.keys(publishers.camera).forEach(toggleVideo);
    Object.keys(publishers.screen).forEach(toggleVideo);
    Object.keys(publishers.sip).forEach(toggleVideo);
    this.analytics.log(LogAction.toggleLocalVideo, LogVariation.success);
  };

  /**
   * Enable or disable remote audio
   * @param subscriberId Subscriber id
   * @param enable
   */
  toggleRemoteAudio = (subscriberId: string, enable: boolean): void => {
    this.analytics.log(LogAction.toggleRemoteAudio, LogVariation.attempt);
    this.communication.enableRemoteAV(subscriberId, 'audio', enable);
    this.analytics.log(LogAction.toggleRemoteAudio, LogVariation.success);
  };

  /**
   * Enable or disable remote video
   * @param subscriberId Subscriber id
   * @param enable
   */
  toggleRemoteVideo = (subscriberId: string, enable: boolean): void => {
    this.analytics.log(LogAction.toggleRemoteVideo, LogVariation.attempt);
    this.communication.enableRemoteAV(subscriberId, 'video', enable);
    this.analytics.log(LogAction.toggleRemoteVideo, LogVariation.success);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
if (typeof window !== 'undefined') {
  window.AccCore = AccCore;
}
