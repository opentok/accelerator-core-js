import { Credential, CoreOptions, PubSubDetail, PubSubSummary, StreamType } from '../models';
export default class State {
    private connected;
    private credentials;
    private options;
    private publishers;
    private session;
    private streamMap;
    private streams;
    private subscribers;
    constructor(credentials: Credential);
    /**
     * Ensures that we have the required credentials
     * @param credentials Credentials for the OpenTok session/user
     */
    private validateCredentials;
    /**
     * Sets the current connection state
     * @param connected Whether we're connected to the session or not
     */
    protected setConnected(connected: boolean): void;
    /**
     * Gets the current connection state
     */
    protected getConnected(): boolean;
    /**
     * Get the options defined
     */
    getOptions(): CoreOptions;
    /**
     * Set the options defined for core
     * @param options Options to use for the session
     */
    setOptions(options: CoreOptions): void;
    /**
     * Gets the current OpenTok session
     */
    getSession(): OT.Session | null;
    /**
     * Sets the current OpenTok session
     * @param session Current OpenTok session
     */
    setSession(session: OT.Session): void;
    /**
     * Gets the current OpenTok credentials
     */
    getCredentials(): Credential | null;
    /**
     * Set the current OpenTok credentials
     * @param credentials OpenTok credentials
     */
    setCredentials(credentials: Credential): void;
    /**
     * Retrieves all streams
     */
    getStreams(): Record<string, OT.Stream>;
    /**
     * Returns the count of current publishers and subscribers by type
     */
    pubSubCount(): PubSubSummary;
    /**
     * Returns the current publishers and subscribers, along with a count of each
     */
    getPubSub(): PubSubDetail;
    /**
     * Gets a subscriber
     * @param streamId Unique identifier of the stream
     */
    getSubscriber(streamId: string): OT.Subscriber | undefined;
    /**
     * Gets a subscriber
     * @param streamId Unique identifier of the stream
     */
    getPublisher(streamId: string): OT.Publisher | undefined;
    /**
     * Gets a subscriber
     * @param type Type of publishers to return
     */
    getPublishers(type: StreamType): OT.Publisher[];
    /**
     * Add publisher to state
     * @param type Type of stream being published
     * @param publisher OpenTok publisher
     */
    addPublisher(type: StreamType, publisher: OT.Publisher): void;
    /**
     * Removes a publisher from state
     * @param type Type of stream being removed
     * @param publisher OpenTok publisher
     */
    removePublisher(type: StreamType, publisher: OT.Publisher): void;
    /**
     * Removes all publishers
     */
    removeAllPublishers(): void;
    /**
     * Adds subscriber
     * @param subscriber Subscriber to add
     */
    addSubscriber(subscriber: OT.Subscriber): void;
    /**
     * Removes a subscriber
     * @param subscriber Subscriber to remove
     */
    removeSubscriber(subscriber: OT.Subscriber): void;
    /**
     * Add a stream to state
     * @param stream An OpenTok stream
     */
    addStream(stream: OT.Stream): void;
    /**
     * Remove a stream from state and any associated subscribers
     * @param stream An OpenTok stream object
     */
    removeStream(stream: OT.Stream): void;
    /**
     * Reset publishers, streams, and subscribers
     */
    reset(): void;
    /**
     * Returns the map of stream ids to publisher/subscriber ids
     */
    getStreamMap(): Record<string, string>;
    /**
     * Returns the contents of state
     */
    all(): unknown;
}
