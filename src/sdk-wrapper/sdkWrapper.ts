import SDKError from './errors';
import State from './state';
import { Credential, StreamType } from '../models';

export default class OpenTokSDK extends State {
  constructor(credentials: Credential, sessionOptions?: unknown) {
    super(credentials);
    const session = OT.initSession(
      credentials.apiKey,
      credentials.sessionId,
      sessionOptions
    );
    if (session) {
      this.setSession(session);
    }
  }

  /**
   * Determines if a connection object is my local connection
   * @param connection An OpenTok connection object
   */
  isMe(connection: OT.Connection): boolean {
    const session = this.getSession();
    return (
      session && session.connection.connectionId === connection.connectionId
    );
  }

  /**
   * Wrap OpenTok session events
   */
  setInternalListeners(): void {
    const session = this.getSession();
    if (session) {
      /**
       * Wrap session events and update state when streams are created
       * or destroyed
       */
      session.on('streamCreated', ({ stream }) => this.addStream(stream));
      session.on('streamDestroyed', ({ stream }) => this.removeStream(stream));
      session.on('sessionConnected sessionReconnected', () =>
        this.setConnected(true)
      );
      session.on('sessionDisconnected', () => this.setConnected(false));
    }
  }

  /**
   * Register a callback for a specific event, pass an object
   * with event => callback key/values (or an array of objects)
   * to register callbacks for multiple events.
   * @param events The name of the events
   * @param callback
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#on
   */
  public on(
    events:
      | string
      | Record<string, (event: string) => void>
      | Record<string, (event: string) => void>[],
    callback?: (event: string) => void
  ): void {
    const session = this.getSession();
    if (session) {
      if (typeof events !== 'string') {
        bindListeners(session, this, events);
      } else if (callback) {
        bindListener(session, this, events, callback);
      }
    }
  }

  /**
   * Remove a callback for a specific event. If no parameters are passed,
   * all callbacks for the session will be removed.
   * @param events The name of the events
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#off
   */
  off(...events: string[]): void {
    const session = this.getSession();
    if (session) {
      session.off(...events);
    }
  }

  /**
   * Enable or disable local publisher audio
   * @param enabled Is audio published?
   */
  enablePublisherAudio(enabled: boolean): void {
    const publishers = this.getPublishers(StreamType.Camera);
    publishers.forEach((publisher) => publisher.publishAudio(enabled));
  }

  /**
   * Enable or disable local publisher video
   * @param enabled Is video published?
   */
  enablePublisherVideo(enabled: boolean): void {
    const publishers = this.getPublishers(StreamType.Camera);
    publishers.forEach((publisher) => publisher.publishVideo(enabled));
  }

  /**
   * Enable or disable local subscriber audio
   * @param streamId Stream Id to enable/disable
   * @param enabled Is audio enabled?
   */
  enableSubscriberAudio(streamId: string, enabled: boolean): void {
    const subscriber = this.getSubscriber(streamId);
    if (subscriber) {
      subscriber.subscribeToAudio(enabled);
    }
  }

  /**
   * Enable or disable local subscriber video
   * @param streamId Stream Id to enable/disable
   * @param enabled Is audio enabled?
   */
  enableSubscriberVideo(streamId: string, enabled: boolean): void {
    const subscriber = this.getSubscriber(streamId);
    if (subscriber) {
      subscriber.subscribeToVideo(enabled);
    }
  }

  /**
   * Create and publish a stream
   * @param element The target element
   * @param properties The publisher properties
   * @param eventListeners An object with eventName/callback key/value pairs
   * @param preview Create a publisher without publishing to the session
   */
  async publish(
    element: string | HTMLElement,
    properties: OT.PublisherProperties,
    eventListeners: Record<string, (event: string) => void> = null,
    preview = false
  ): Promise<OT.Publisher> {
    const publisher = await this.initPublisher(element, properties);
    if (eventListeners) {
      bindListeners(publisher, this, eventListeners);
    }

    if (preview) {
      return publisher;
    } else {
      return await this.publishPreview(publisher);
    }
  }

  /**
   * Publish a 'preview' stream to the session
   * @param publisher An OpenTok publisher object
   */
  async publishPreview(publisher: OT.Publisher): Promise<OT.Publisher> {
    return await new Promise((resolve, reject) => {
      const session = this.getSession();
      if (session) {
        session.publish(publisher, (error) => {
          if (error) {
            reject(error);
          }

          this.addPublisher(
            publisher.stream.videoType as StreamType,
            publisher
          );

          resolve(publisher);
        });
      } else {
        reject('Unable to publish without an active connection to a session');
      }
    });
  }

  /**
   * Stop publishing a stream
   * @param publisher An OpenTok publisher object
   */
  unpublish(publisher: OT.Publisher): void {
    const type = publisher.stream.videoType as StreamType;
    const session = this.getSession();
    if (session) {
      session.unpublish(publisher);
    }
    this.removePublisher(type, publisher);
  }

  /**
   * Subscribe to stream
   * @param stream OpenTok stream to subscribe to
   * @param container The id of the container or a reference to the element
   * @param properties Settings to use in the subscription of the stream
   * @param eventListeners An object eventName/callback key/value pairs
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
   */
  async subscribe(
    stream: OT.Stream,
    container: string | HTMLElement,
    properties: OT.SubscriberProperties,
    eventListeners: Record<string, (event: string) => void> = null
  ): Promise<OT.Subscriber> {
    return await new Promise((resolve, reject) => {
      const session = this.getSession();
      if (session) {
        const subscriber = session.subscribe(
          stream,
          container,
          properties,
          (error) => {
            if (error) {
              reject(error);
            } else {
              this.addSubscriber(subscriber);
              if (eventListeners) {
                bindListeners(subscriber, this, eventListeners);
              }
              resolve(subscriber);
            }
          }
        );
      } else {
        reject(
          'Unable to subscribe to a stream when not connected to a session'
        );
      }
    });
  }

  /**
   * Unsubscribe from a stream and update the state
   * @param subscriber An OpenTok subscriber object
   */
  async unsubscribe(subscriber: OT.Subscriber): Promise<void> {
    return await new Promise((resolve) => {
      const session = this.getSession();
      if (session) {
        session.unsubscribe(subscriber);
      }
      this.removeSubscriber(subscriber);
      resolve();
    });
  }

  /**
   * Connect to the OpenTok session
   * @param eventListeners An object with eventName/callback key/value pairs
   */
  async connect(
    eventListeners: Record<string, (event: string) => void> = null
  ): Promise<void> {
    this.off();
    this.setInternalListeners();
    if (eventListeners) {
      this.on(eventListeners);
    }
    return await new Promise((resolve, reject) => {
      const credentials = this.getCredentials();
      if (credentials && credentials.token) {
        const session = this.getSession();
        if (session) {
          session.connect(credentials.token, (error) => {
            error ? reject(error) : resolve();
          });
        }
      } else {
        reject('Token not provided');
      }
    });
  }

  /**
   * Force a remote connection to leave the session
   * @param connection Connection to disconnect
   */
  async forceDisconnect(connection: OT.Connection): Promise<void> {
    return await new Promise((resolve, reject) => {
      const session = this.getSession();
      if (session) {
        session.forceDisconnect(connection, (error) => {
          error ? reject(error) : resolve();
        });
      }
    });
  }

  /**
   * Force the publisher of a stream to stop publishing the stream
   * @param stream Stream to unpublish
   */
  async forceUnpublish(stream: OT.Stream): Promise<void> {
    return await new Promise((resolve, reject) => {
      const session = this.getSession();
      if (session) {
        session.forceUnpublish(stream, (error) => {
          error ? reject(error) : resolve();
        });
      }
    });
  }

  /**
   * Send a signal using the OpenTok signaling apiKey
   * @param type Message type
   * @param signalData Data to send
   * @param to An OpenTok connection object
   * @see https://tokbox.com/developer/guides/signaling/js/
   */
  async signal(
    type: string,
    signalData: unknown,
    to: OT.Connection
  ): Promise<void> {
    const data = JSON.stringify(signalData);
    const signal = to ? { type, data, to } : { type, data };
    return await new Promise((resolve, reject) => {
      const session = this.getSession();
      if (session) {
        session.signal(signal, (error) => {
          error ? reject(error) : resolve();
        });
      }
    });
  }

  /**
   * Disconnect from the OpenTok session
   */
  disconnect(): void {
    const session = this.getSession();
    if (session) {
      session.disconnect();
    }
    this.reset();
  }

  /**
   * Return the state of the OpenTok session
   */
  state(): unknown {
    return this.all();
  }

  /**
   * Initialize an OpenTok publisher object
   * @param element The target element
   * @param properties The publisher properties
   */
  async initPublisher(
    element: string | HTMLElement,
    properties: OT.PublisherProperties
  ): Promise<OT.Publisher> {
    return await new Promise((resolve, reject) => {
      const publisher = OT.initPublisher(element, properties, (error) => {
        error ? reject(error) : resolve(publisher);
      });
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
if (typeof window !== 'undefined') {
  window.OpenTokSDK = OpenTokSDK;
}

/**
 * Binds and sets a single event listener on the OpenTok session
 * @param event The name of the event
 * @param callback
 */
const bindListener = (
  target: OT.Session | OT.Publisher | OT.Subscriber,
  context: unknown,
  event: string,
  callback: (event: string) => void
) => {
  const paramsError =
    "'on' requires a string and a function to create an event listener.";
  if (typeof event !== 'string' || typeof callback !== 'function') {
    throw new SDKError('okSDK', paramsError, 'invalidParameters');
  }
  target.on(event, callback.bind(context));
};

/**
 * Bind and set event listeners
 * @param target An OpenTok session, publisher, or subscriber object
 * @param context The context to which to bind event listeners
 * @param listeners An object (or array of objects) with eventName/callback k/v pairs
 */
const bindListeners = (
  target: OT.Session | OT.Publisher | OT.Subscriber,
  context: unknown,
  listeners:
    | string
    | Record<string, (event: string) => void>
    | Record<string, (event: string) => void>[]
): void => {
  /**
   * Create listeners from an object with event/callback k/v pairs
   * @param listeners
   */
  const createListenersFromObject = (
    eventListeners: Record<string, (event: string) => void>
  ): void => {
    Object.keys(eventListeners).forEach((event) => {
      bindListener(target, context, event, eventListeners[event]);
    });
  };

  if (Array.isArray(listeners)) {
    listeners.forEach((listener) => createListenersFromObject(listener));
  } else {
    createListenersFromObject(
      listeners as Record<string, (event: string) => void>
    );
  }
};
