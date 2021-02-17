import { SDKError } from './sdk-wrapper/errors';
import { dom, message, properCase } from './utils';

import { defaultCallProperties } from './constants';
import {
  CommunicationOptions,
  PubSubDetail,
  StreamCollection,
  StreamEvent,
  StreamType
} from './models';
import { AccCore } from './core';
import { OpenTokSDK } from './sdk-wrapper/sdkWrapper';
import { Analytics } from './analytics';
import { CoreEvents, LogAction, LogVariation, OpenTokEvents } from './enums';

/**
 *
 */
export class Communication {
  private active = false;
  private core: AccCore;
  private OpenTokSDK: OpenTokSDK;
  private analytics: Analytics;
  private streamContainers: (
    pubSub: 'publisher' | 'subscriber',
    type: StreamType,
    data?: unknown,
    streamId?: string
  ) => string | Element;
  private callProperties: OT.PublisherProperties;
  private screenProperties: OT.PublisherProperties;
  private subscribeOnly: boolean;
  private autoSubscribe: boolean;
  private connectionLimit?: number;

  constructor(options: CommunicationOptions) {
    this.validateOptions(options);
    this.createEventListeners();
  }

  validateOptions = (options: CommunicationOptions): void => {
    const requiredOptions = ['core', 'analytics', 'session'];
    requiredOptions.forEach((option) => {
      if (!options[option]) {
        throw new SDKError(
          'otAccCore',
          `${option} is a required option.`,
          'invalidParameters'
        );
      }
    });

    this.core = options.core;
    this.OpenTokSDK = this.core.OpenTokSDK;
    this.analytics = options.analytics;
    this.streamContainers = options.streamContainers;
    this.connectionLimit = options.coreCommunicationOptions?.connectionLimit;
    this.autoSubscribe =
      (options.coreCommunicationOptions &&
        options.coreCommunicationOptions.autoSubscribe) ||
      true;
    this.subscribeOnly =
      (options.coreCommunicationOptions &&
        options.coreCommunicationOptions.subscribeOnly) ||
      false;

    this.callProperties = Object.assign(
      {},
      defaultCallProperties,
      options.coreCommunicationOptions?.callProperties
    );
    this.screenProperties = Object.assign(
      {},
      defaultCallProperties,
      { videoSource: 'window' },
      options.coreCommunicationOptions?.screenProperties
    );
  };

  /**
   * Trigger an event through the API layer
   * @param event The name of the event
   * @param data
   */
  triggerEvent = (event: string, data: unknown): void =>
    this.core.triggerEvent(event, data);

  /**
   * Determine whether or not the party is able to join the call based on
   * the specified connection limit, if any.
   */
  ableToJoin = (): boolean => {
    if (!this.connectionLimit) {
      return true;
    }
    // Not using the session here since we're concerned with number of active publishers
    const connections = Object.values(this.OpenTokSDK.getStreams()).filter(
      (s) => s.videoType === StreamType.Camera
    );
    return connections.length < this.connectionLimit;
  };

  /**
   * Publish the local camera stream and update state
   * @param publisherProperties Properties of the published stream
   */
  publish = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<OT.Publisher | undefined> => {
    /**
     * For subscriber tokens or cases where we just don't want to be seen or heard.
     */
    if (this.subscribeOnly) {
      message(
        'Instance is configured with subscribeOnly set to true. Cannot publish to session'
      );
      return undefined;
    }

    this.analytics.log(LogAction.startCall, LogVariation.attempt);

    try {
      const props = Object.assign({}, this.callProperties, publisherProperties);
      const container = dom.element(
        this.streamContainers('publisher', StreamType.Camera)
      );
      const publisher = await this.OpenTokSDK.publish(
        container as HTMLElement,
        props
      );
      this.OpenTokSDK.addPublisher(StreamType.Camera, publisher);
      return publisher;
    } catch (error) {
      this.analytics.log(LogAction.startCall, LogVariation.fail);
      const errorMessage =
        error.code === 1010 ? 'Check your network connection' : error.message;
      this.triggerEvent('error', errorMessage);
      return undefined;
    }
  };

  /**
   * Subscribe to a stream and update the state
   * @param stream An OpenTok stream object
   * @param subsriberOptions Specific options for this subscriber
   * @param networkTest Are we subscribing to our own publisher for a network test?
   */
  subscribe = async (
    stream: OT.Stream,
    subscriberProperties?: OT.SubscriberProperties,
    networkTest = false
  ): Promise<OT.Subscriber> => {
    this.analytics.log(LogAction.subscribe, LogVariation.attempt);

    const streamMap = this.OpenTokSDK.getStreamMap();

    // No videoType indicates SIP https://tokbox.com/developer/guides/sip/
    const type: StreamType = (stream.videoType as StreamType) || StreamType.SIP;

    if (streamMap[stream.streamId] && !networkTest) {
      // Are we already subscribing to the stream?
      return this.OpenTokSDK.getSubscriber(stream.streamId);
    } else {
      let connectionData: string | unknown;
      try {
        connectionData = JSON.parse(stream.connection.data || null);
      } catch (e) {
        connectionData = stream.connection.data;
      }

      const container = dom.element(
        this.streamContainers(
          'subscriber',
          type,
          connectionData,
          stream.streamId
        )
      );
      const options = Object.assign(
        {},
        type === StreamType.Camera || type === StreamType.SIP
          ? this.callProperties
          : this.screenProperties,
        subscriberProperties
      );

      try {
        const subscriber = await this.OpenTokSDK.subscribe(
          stream,
          container as HTMLElement,
          options
        );

        this.triggerEvent(
          `subscribeTo${properCase(type)}`,
          Object.assign({}, { subscriber }, this.OpenTokSDK.all())
        );

        this.analytics.log(LogAction.subscribe, LogVariation.success);
        return subscriber;
      } catch (error) {
        this.analytics.log(LogAction.subscribe, LogVariation.fail);
        return Promise.reject(error);
      }
    }
  };

  /**
   * Unsubscribe from a stream and update the state
   * @param subscriber An OpenTok subscriber object
   */
  unsubscribe = async (subscriber: OT.Subscriber): Promise<void> => {
    this.analytics.log(LogAction.unsubscribe, LogVariation.attempt);
    await this.OpenTokSDK.unsubscribe(subscriber);
    this.analytics.log(LogAction.unsubscribe, LogVariation.success);
  };

  /**
   * Subscribe to new stream unless autoSubscribe is set to false
   * @param streamEvent An OpenTok event with a stream property
   */
  onStreamCreated = async (streamEvent: StreamEvent): Promise<void> => {
    this.active &&
      this.autoSubscribe &&
      streamEvent.stream &&
      (await this.subscribe(streamEvent.stream));
  };

  /**
   * Update state and trigger corresponding event(s) when stream is destroyed
   * @param streamEvent An OpenTok event with a stream property
   */
  onStreamDestroyed = (streamEvent: StreamEvent): void => {
    const type = (streamEvent.stream.videoType as StreamType) || StreamType.SIP;
    this.triggerEvent(
      `unsubscribeFrom${properCase(type)}`,
      this.OpenTokSDK.getPubSub()
    );
  };

  /**
   * Listen for API-level events
   */
  createEventListeners = (): void => {
    this.core.on(OpenTokEvents.StreamCreated, this.onStreamCreated);
    this.core.on(OpenTokEvents.StreamDestroyed, this.onStreamDestroyed);
  };

  /**
   * Start publishing the local camera feed and subscribing to streams in the session
   * @param publisherProperties Properties for this specific publisher
   */
  startCall = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<PubSubDetail & { publisher: OT.Publisher }> => {
    this.analytics.log(LogAction.startCall, LogVariation.attempt);

    this.active = true;
    const initialStreams = this.OpenTokSDK.getStreams();

    /**
     * Determine if we're able to join the session based on an existing connection limit
     */
    if (!this.ableToJoin()) {
      const errorMessage = 'Session has reached its connection limit';
      this.triggerEvent('error', errorMessage);
      this.analytics.log(LogAction.startCall, LogVariation.fail);
      return Promise.reject(
        new SDKError('otCore', errorMessage, 'connectionLimit')
      );
    }

    let publisher;

    try {
      publisher = await this.publish(publisherProperties);

      /**
       * Subscribe to any streams that existed before we start the call from our side.
       */

      // Get an array of initial subscription promises
      const initialSubscriptions = (): Promise<OT.Subscriber | void>[] => {
        if (this.autoSubscribe) {
          return Object.values(initialStreams).map((stream) =>
            this.subscribe(stream)
          );
        }
        return [Promise.resolve()];
      };

      await Promise.all(initialSubscriptions());

      const pubSubData = Object.assign({}, this.OpenTokSDK.getPubSub(), {
        publisher
      });
      this.triggerEvent(CoreEvents.StartCall, pubSubData);
      return pubSubData;
    } catch (error) {
      message(`Failed to subscribe to all existing streams: ${error}`);
      // We do not reject here in case we still successfully publish to the session
      return Object.assign({}, this.OpenTokSDK.getPubSub(), { publisher });
    }
  };

  /**
   * Stop publishing and unsubscribe from all streams
   */
  endCall = async (): Promise<void> => {
    this.analytics.log(LogAction.endCall, LogVariation.attempt);
    const { publishers, subscribers } = this.OpenTokSDK.getPubSub();

    const unpublish = (publisher) => this.OpenTokSDK.unpublish(publisher);

    Object.values(publishers.camera).forEach(unpublish);
    Object.values(publishers.screen).forEach(unpublish);

    const unsubscribeFromAll = (
      subscriberCollection: StreamCollection<OT.Subscriber>
    ) => {
      const subscribers = {
        ...subscriberCollection.camera,
        ...subscriberCollection.screen
      };
      return Object.values(subscribers).map((subscriber) =>
        this.unsubscribe(subscriber as OT.Subscriber)
      );
    };

    await Promise.all(unsubscribeFromAll(subscribers));

    this.active = false;
    this.triggerEvent('endCall', null);
    this.analytics.log(LogAction.endCall, LogVariation.success);
  };

  /**
   * Enable/disable local audio or video
   * @param id
   * @param source 'audio' or 'video'
   * @param enable Whether to device is enabled or not
   */
  enableLocalAV = (
    id: string,
    source: 'audio' | 'video',
    enable: boolean
  ): void => {
    const method = `publish${properCase(source)}`;
    const { publishers } = this.OpenTokSDK.getPubSub();

    const publisher = publishers.camera[id] || publishers.screen[id];
    publisher[method](enable);
  };

  /**
   * Enable/disable remote audio or video
   * @param subscriberId
   * @param source 'audio' or 'video'
   * @param enable
   */
  enableRemoteAV = (
    subscriberId: string,
    source: 'audio' | 'video',
    enable: boolean
  ): void => {
    const method = `subscribeTo${properCase(source)}`;
    const { subscribers } = this.OpenTokSDK.getPubSub();
    const subscriber =
      subscribers.camera[subscriberId] || subscribers.sip[subscriberId];
    subscriber[method](enable);
  };
}
