import { CommunicationOptions, PubSubDetail, StreamEvent } from './models';
/**
 *
 */
export declare class Communication {
    private active;
    private core;
    private OpenTokSDK;
    private analytics;
    private streamContainers;
    private callProperties;
    private screenProperties;
    private subscribeOnly;
    private autoSubscribe;
    private connectionLimit?;
    constructor(options: CommunicationOptions);
    validateOptions: (options: CommunicationOptions) => void;
    /**
     * Trigger an event through the API layer
     * @param event The name of the event
     * @param data
     */
    triggerEvent: (event: string, data: unknown) => void;
    /**
     * Determine whether or not the party is able to join the call based on
     * the specified connection limit, if any.
     */
    ableToJoin: () => boolean;
    /**
     * Publish the local camera stream and update state
     * @param publisherProperties Properties of the published stream
     */
    publish: (publisherProperties: OT.PublisherProperties) => Promise<OT.Publisher | undefined>;
    /**
     * Subscribe to a stream and update the state
     * @param stream An OpenTok stream object
     * @param subsriberOptions Specific options for this subscriber
     * @param networkTest Are we subscribing to our own publisher for a network test?
     */
    subscribe: (stream: OT.Stream, subscriberProperties?: OT.SubscriberProperties, networkTest?: boolean) => Promise<OT.Subscriber>;
    /**
     * Unsubscribe from a stream and update the state
     * @param subscriber An OpenTok subscriber object
     */
    unsubscribe: (subscriber: OT.Subscriber) => Promise<void>;
    /**
     * Subscribe to new stream unless autoSubscribe is set to false
     * @param streamEvent An OpenTok event with a stream property
     */
    onStreamCreated: (streamEvent: StreamEvent) => Promise<void>;
    /**
     * Update state and trigger corresponding event(s) when stream is destroyed
     * @param streamEvent An OpenTok event with a stream property
     */
    onStreamDestroyed: (streamEvent: StreamEvent) => void;
    /**
     * Listen for API-level events
     */
    createEventListeners: () => void;
    /**
     * Start publishing the local camera feed and subscribing to streams in the session
     * @param publisherProperties Properties for this specific publisher
     */
    startCall: (publisherProperties: OT.PublisherProperties) => Promise<PubSubDetail & {
        publisher: OT.Publisher;
    }>;
    /**
     * Stop publishing and unsubscribe from all streams
     */
    endCall: () => Promise<void>;
    /**
     * Enable/disable local audio or video
     * @param id
     * @param source 'audio' or 'video'
     * @param enable Whether to device is enabled or not
     */
    enableLocalAV: (id: string, source: 'audio' | 'video', enable: boolean) => void;
    /**
     * Enable/disable remote audio or video
     * @param subscriberId
     * @param source 'audio' or 'video'
     * @param enable
     */
    enableRemoteAV: (subscriberId: string, source: 'audio' | 'video', enable: boolean) => void;
}
