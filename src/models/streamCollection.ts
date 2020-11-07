import OT from '@opentok/client';
import { StreamCollectionSummary, StreamType } from './streamCollectionSummary';

export interface IStream {
  id?: string;
  stream?: OT.Stream;
}

export class StreamCollection<T extends IStream> {
  public camera: Record<string, T> = {};
  public custom: Record<string, T> = {};
  public screen: Record<string, T> = {};
  public sip: Record<string, T> = {};

  /**
   * Returns the number of camera, screen and total streams
   */
  getCount(): StreamCollectionSummary {
    return new StreamCollectionSummary(
      Object.keys(this.camera).length,
      Object.keys(this.custom).length,
      Object.keys(this.screen).length,
      Object.keys(this.sip).length
    );
  }

  /**
   * Adds the stream
   * @param type Type of stream
   * @param provider Subscriber or Publisher
   */
  addStream(type: StreamType, provider: T): void {
    this[type][provider.id || provider.stream?.streamId] = provider;
  }

  /**
   * Adds the stream
   * @param type Type of stream
   * @param provider Subscriber or Publisher
   */
  removeStream(type: StreamType, provider: T): void {
    delete this[type][provider.id || provider.stream?.streamId];
  }

  getStream(id: string): T {
    return (
      this.camera[id] || this.screen[id] || this.custom[id] || this.sip[id]
    );
  }

  /**
   * Clears all streams from state
   */
  reset(): void {
    this.camera = {};
    this.custom = {};
    this.screen = {};
    this.sip = {};
  }
}
