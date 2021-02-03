import { State } from './state';
import { Credential } from '../models';
export declare class OpenTokSDK extends State {
    constructor(credentials: Credential, sessionOptions?: unknown);
    /**
     * Determines if a connection object is my local connection
     * @param connection An OpenTok connection object
     */
    isMe(connection: OT.Connection): boolean;
    /**
     * Wrap OpenTok session events
     */
    setInternalListeners(): void;
    /**
     * Register a callback for a specific event, pass an object
     * with event => callback key/values (or an array of objects)
     * to register callbacks for multiple events.
     * @param events The name of the events
     * @param callback
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#on
     */
    on(events: string | Record<string, (event: OT.Event<string, unknown>) => void> | Record<string, (event: OT.Event<string, unknown>) => void>[], callback?: (event: OT.Event<string, unknown>) => void): void;
    /**
     * Remove a callback for a specific event. If no parameters are passed,
     * all callbacks for the session will be removed.
     * @param events The name of the events
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#off
     */
    off(...events: string[]): void;
    /**
     * Enable or disable local publisher audio
     * @param enabled Is audio published?
     */
    enablePublisherAudio(enabled: boolean): void;
    /**
     * Enable or disable local publisher video
     * @param enabled Is video published?
     */
    enablePublisherVideo(enabled: boolean): void;
    /**
     * Enable or disable local subscriber audio
     * @param streamId Stream Id to enable/disable
     * @param enabled Is audio enabled?
     */
    enableSubscriberAudio(streamId: string, enabled: boolean): void;
    /**
     * Enable or disable local subscriber video
     * @param streamId Stream Id to enable/disable
     * @param enabled Is audio enabled?
     */
    enableSubscriberVideo(streamId: string, enabled: boolean): void;
    /**
     * Create and publish a stream
     * @param element The target element
     * @param properties The publisher properties
     * @param eventListeners An object with eventName/callback key/value pairs
     * @param preview Create a publisher without publishing to the session
     */
    publish(element: string | HTMLElement, properties: OT.PublisherProperties, eventListeners?: Record<string, (event: OT.Event<string, unknown>) => void>, preview?: boolean): Promise<OT.Publisher>;
    /**
     * Publish a 'preview' stream to the session
     * @param publisher An OpenTok publisher object
     */
    publishPreview(publisher: OT.Publisher): Promise<OT.Publisher>;
    /**
     * Stop publishing a stream
     * @param publisher An OpenTok publisher object
     */
    unpublish(publisher: OT.Publisher): void;
    /**
     * Subscribe to stream
     * @param stream OpenTok stream to subscribe to
     * @param container The id of the container or a reference to the element
     * @param properties Settings to use in the subscription of the stream
     * @param eventListeners An object eventName/callback key/value pairs
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
     */
    subscribe(stream: OT.Stream, container: string | HTMLElement, properties: OT.SubscriberProperties, eventListeners?: Record<string, (event: OT.Event<string, unknown>) => void>): Promise<OT.Subscriber>;
    /**
     * Unsubscribe from a stream and update the state
     * @param subscriber An OpenTok subscriber object
     */
    unsubscribe(subscriber: OT.Subscriber): Promise<void>;
    /**
     * Connect to the OpenTok session
     * @param eventListeners An object with eventName/callback key/value pairs
     */
    connect(eventListeners?: Record<string, (event: OT.Event<string, unknown>) => void>): Promise<void>;
    /**
     * Force a remote connection to leave the session
     * @param connection Connection to disconnect
     */
    forceDisconnect(connection: OT.Connection): Promise<void>;
    /**
     * Force the publisher of a stream to stop publishing the stream
     * @param stream Stream to unpublish
     */
    forceUnpublish(stream: OT.Stream): Promise<void>;
    /**
     * Send a signal using the OpenTok signaling apiKey
     * @param type Message type
     * @param signalData Data to send
     * @param to An OpenTok connection object
     * @see https://tokbox.com/developer/guides/signaling/js/
     */
    signal(type: string, signalData: unknown, to: OT.Connection): Promise<void>;
    /**
     * Disconnect from the OpenTok session
     */
    disconnect(): void;
    /**
     * Return the state of the OpenTok session
     */
    state(): unknown;
    /**
     * Initialize an OpenTok publisher object
     * @param element The target element
     * @param properties The publisher properties
     */
    initPublisher(element: string | HTMLElement, properties: OT.PublisherProperties): Promise<OT.Publisher>;
    /**
     * Binds and sets a single event listener on the OpenTok session
     * @param target An OpenTok session, publisher, or subscriber object
     * @param context The context to which to bind event listeners
     * @param event The name of the event
     * @param callback
     */
    bindListener(target: OT.Session | OT.Publisher | OT.Subscriber, context: unknown, event: string, callback: (event: OT.Event<string, any>) => void): void;
    /**
     * Bind and set event listeners
     * @param target An OpenTok session, publisher, or subscriber object
     * @param context The context to which to bind event listeners
     * @param listeners An object (or array of objects) with eventName/callback k/v pairs
     */
    bindListeners(target: OT.Session | OT.Publisher | OT.Subscriber, context: unknown, listeners: Record<string, (event: OT.Event<string, any>) => void> | Record<string, (event: OT.Event<string, any>) => void>[]): void;
}
