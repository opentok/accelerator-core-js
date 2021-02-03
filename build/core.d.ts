import { OpenTokSDK } from './sdk-wrapper/sdkWrapper';
import { Analytics } from './analytics';
import { Communication } from './communication';
import { Packages } from './enums';
import { IAnnotation, CoreOptions, Credential, PubSubDetail, ITextChat, IScreenSharing, IArchiving } from './models';
import { dom } from './utils';
export declare class AccCore {
    OpenTokSDK: OpenTokSDK;
    analytics: Analytics;
    communication: Communication;
    textChat: ITextChat;
    screenSharing: IScreenSharing;
    annotation: IAnnotation;
    archiving: IArchiving;
    static utils: {
        dom: typeof dom;
        message: (messageText: string) => void;
        path: (props: string | string[], obj: unknown) => unknown;
        pathOr: (defaultValue: unknown, props: string | [], obj: unknown) => unknown;
        properCase: (text: string) => string;
    };
    eventListeners: Record<string, Set<(event: unknown) => void>>;
    constructor(options: CoreOptions);
    /**
     * Connect to the session
     */
    connect: () => Promise<void>;
    /**
     * Gets the current session
     */
    getSession: () => OT.Session;
    /**
     * Gets the current credentials
     */
    getCredentials: () => Credential;
    /**
     * Gets the current options
     */
    getOptions: () => CoreOptions;
    /**
     * Register a callback for a specific event or pass an object with
     * with event => callback key/value pairs to register listeners for
     * multiple events.
     * @param event The name of the event
     * @param callback
     */
    on: (event: string | unknown, callback: (event: unknown) => void) => void;
    /**
     * Remove a callback for a specific event.  If no parameters are passed,
     * all event listeners will be removed.
     * @param event - The name of the event
     * @param callback
     */
    off: (event: string, callback: (event: unknown) => void) => void;
    /**
     * Establishes all events we could be listening to and
     * any callbacks that should occur.
     */
    private createEventListeners;
    /**
     * Register events that can be listened to be other components/modules
     * @param events A list of event names. A single event may
     * also be passed as a string.
     */
    registerEvents: (events: string | string[]) => void;
    /**
     * Trigger an event and fire all registered callbacks
     * @param event The name of the event
     * @param data Data to be passed to callback functions
     */
    triggerEvent: (event: string, data: unknown) => void;
    initPackages: () => void;
    setupExternalAnnotation: () => Promise<void>;
    linkAnnotation: (pubSub: OT.Publisher | OT.Subscriber, annotationContainer: HTMLElement, externalWindow: string | HTMLElement) => void;
    /**
     * Get access to an accelerator pack
     * @param packageName textChat, screenSharing, annotation, or archiving
     */
    getAccPack: (packageName: Packages) => unknown;
    /**
     * Disconnect from the session
     * @returns {Promise} <resolve: -, reject: Error>
     */
    disconnect: () => void;
    /**
     * Force a remote connection to leave the session
     * @param connection
     */
    forceDisconnect: (connection: OT.Connection) => Promise<void>;
    /**
     * Start publishing video and subscribing to streams
     * @param publisherProperties
     * @see https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
     */
    startCall: (publisherProperties: OT.PublisherProperties) => Promise<PubSubDetail & {
        publisher: OT.Publisher;
    }>;
    /**
     * Stop all publishing un unsubscribe from all streams
     */
    endCall: () => Promise<void>;
    /**
     * Retrieve current state of session
     */
    state: () => unknown;
    /**
     * Manually subscribe to a stream
     * @param stream An OpenTok stream
     * @param subscriberProperties
     * @param networkTest Subscribing to our own publisher as part of a network test?
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
     */
    subscribe: (stream: OT.Stream, subscriberProperties: OT.SubscriberProperties, networkTest?: boolean) => Promise<OT.Subscriber>;
    /**
     * Manually unsubscribe from a stream
     * @param subscriber An OpenTok subscriber object
     */
    unsubscribe: (subscriber: OT.Subscriber) => Promise<void>;
    /**
     * Force the publisher of a stream to stop publishing the stream
     * @param stream An OpenTok stream object
     */
    forceUnpublish: (stream: OT.Stream) => Promise<void>;
    /**
     * Get the local publisher object for a stream
     * @param stream An OpenTok stream object
     */
    getPublisherForStream: (stream: OT.Stream) => OT.Publisher;
    /**
     * Get the local subscriber objects for a stream
     * @param stream An OpenTok stream object
     */
    getSubscribersForStream: (stream: OT.Stream) => [OT.Subscriber];
    /**
     * Send a signal using the OpenTok signaling apiKey
     * @param type
     * @param data
     * @param to An OpenTok connection object
     */
    signal: (type: string, data: unknown, to: OT.Connection) => Promise<void>;
    /**
     * Enable or disable local audio
     * @param enable
     */
    toggleLocalAudio: (enable: boolean) => void;
    /**
     * Enable or disable local video
     * @param enable
     */
    toggleLocalVideo: (enable: boolean) => void;
    /**
     * Enable or disable remote audio
     * @param subscriberId Subscriber id
     * @param enable
     */
    toggleRemoteAudio: (subscriberId: string, enable: boolean) => void;
    /**
     * Enable or disable remote video
     * @param subscriberId Subscriber id
     * @param enable
     */
    toggleRemoteVideo: (subscriberId: string, enable: boolean) => void;
}
