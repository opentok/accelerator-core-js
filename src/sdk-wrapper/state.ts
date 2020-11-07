import OT from '@opentok/client';
import {
  Credential,
  Options,
  PubSubDetail,
  PubSubSummary,
  StreamCollection,
  StreamType
} from '../models';
import SDKError from './errors';

export default class State {
  private connected: boolean;
  private credentials: Credential | null = null;
  private options: Options;
  private publishers: StreamCollection<OT.Publisher>;
  private session: OT.Session | null = null;
  private streamMap: Record<string, string>;
  private streams: Record<string, OT.Stream>;
  private subscribers: StreamCollection<OT.Subscriber>;

  constructor(credentials: Credential) {
    this.validateCredentials(credentials);
  }

  /**
   * Ensures that we have the required credentials
   * @param credentials Credentials for the OpenTok session/user
   */
  private validateCredentials(credentials: Credential): void {
    const required = ['apiKey', 'sessionId', 'token'];
    required.forEach((credential) => {
      if (!credentials[credential]) {
        throw new SDKError(
          `${credential} is a required credential`,
          'invalidParameters'
        );
      }
    });
    this.credentials = credentials;
  }

  /**
   * Sets the current connection state
   * @param connected Whether we're connected to the session or not
   */
  protected setConnected(connected: boolean): void {
    this.connected = connected;
  }

  /**
   * Gets the current connection state
   */
  protected getConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the options defined
   */
  protected getOptions(): Options {
    return this.options;
  }

  /**
   * Set the options defined for core
   * @param options Options to use for the session
   */
  protected setOptions(options: Options): void {
    this.options = options;
  }

  /**
   * Gets the current OpenTok session
   */
  protected getSession(): OT.Session | null {
    return this.session;
  }

  /**
   * Sets the current OpenTok session
   * @param session Current OpenTok session
   */
  protected setSession(session: OT.Session): void {
    this.session = session;
  }

  /**
   * Gets the current OpenTok credentials
   */
  protected getCredentials(): Credential | null {
    return this.credentials;
  }

  /**
   * Set the current OpenTok credentials
   * @param credentials OpenTok credentials
   */
  protected setCredentials(credentials: Credential): void {
    this.validateCredentials(credentials);
  }

  /**
   * Retrieves all streams
   */
  protected getStreams(): Record<string, OT.Stream> {
    return this.streams;
  }

  /**
   * Returns the count of current publishers and subscribers by type
   */
  protected pubSubCount(): PubSubSummary {
    return new PubSubSummary(this.publishers, this.subscribers);
  }

  /**
   * Returns the current publishers and subscribers, along with a count of each
   */
  protected getPubSub(): PubSubDetail {
    return new PubSubDetail(this.publishers, this.subscribers);
  }

  /**
   * Gets a subscriber
   * @param streamId Unique identifier of the stream
   */
  protected getSubscriber(streamId: string): OT.Subscriber | undefined {
    const id = this.streamMap[streamId];
    if (id) {
      return this.subscribers.getStream(id);
    }
    return undefined;
  }

  /**
   * Gets a subscriber
   * @param streamId Unique identifier of the stream
   */
  protected getPublisher(streamId: string): OT.Publisher | undefined {
    const id = this.streamMap[streamId];
    if (id) {
      return this.publishers.getStream(id);
    }
    return undefined;
  }

  /**
   * Gets a subscriber
   * @param type Type of publishers to return
   */
  protected getPublishers(type: StreamType): OT.Publisher[] {
    return Object.values(this.publishers[type]).map((publisher) => publisher);
  }

  /**
   * Add publisher to state
   * @param type Type of stream being published
   * @param publisher OpenTok publisher
   */
  protected addPublisher(type: StreamType, publisher: OT.Publisher): void {
    this.publishers.addStream(type, publisher);
    this.streamMap[publisher.stream.streamId] = publisher.id;
  }

  /**
   * Removes a publisher from state
   * @param type Type of stream being removed
   * @param publisher OpenTok publisher
   */
  protected removePublisher(type: StreamType, publisher: OT.Publisher): void {
    this.publishers.removeStream(type, publisher);
  }

  /**
   * Removes all publishers
   */
  protected removeAllPublishers(): void {
    this.publishers.reset();
  }

  /**
   * Adds subscriber
   * @param subscriber Subscriber to add
   */
  protected addSubscriber(subscriber: OT.Subscriber): void {
    this.subscribers.addStream(
      subscriber.stream.videoType as StreamType,
      subscriber
    );
    this.streamMap[subscriber.stream.streamId] = subscriber.id;
  }

  /**
   * Removes a subscriber
   * @param subscriber Subscriber to remove
   */
  protected removeSubscriber(subscriber: OT.Subscriber): void {
    this.subscribers.removeStream(
      subscriber.stream.videoType as StreamType,
      subscriber
    );
  }

  /**
   * Add a stream to state
   * @param stream An OpenTok stream
   */
  protected addStream(stream: OT.Stream): void {
    this.streams[stream.streamId] = stream;
  }

  /**
   * Remove a stream from state and any associated subscribers
   * @param stream An OpenTok stream object
   */
  protected removeStream(stream: OT.Stream): void {
    const type = stream.videoType;
    const subscriberId = this.streamMap[stream.streamId];
    delete this.streamMap[stream.streamId];
    delete this.streams[stream.streamId];
    this.removeSubscriber(this.subscribers[type][subscriberId]);
  }

  /**
   * Reset publishers, streams, and subscribers
   */
  protected reset(): void {
    this.publishers.reset();
    this.subscribers.reset();
    this.streamMap = {};
    this.streams = {};
  }

  /**
   * Returns the contents of state
   */
  protected all(): unknown {
    return Object.assign(
      this.streams,
      this.streamMap,
      this.connected,
      this.getPubSub()
    );
  }
}
