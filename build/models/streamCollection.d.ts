import OT from '@opentok/client';
import { StreamCollectionSummary, StreamType } from './streamCollectionSummary';
export interface IStream {
    id?: string;
    stream?: OT.Stream;
}
export declare class StreamCollection<T extends IStream> {
    camera: Record<string, T>;
    custom: Record<string, T>;
    screen: Record<string, T>;
    sip: Record<string, T>;
    /**
     * Returns the number of camera, screen and total streams
     */
    getCount(): StreamCollectionSummary;
    /**
     * Adds the stream
     * @param type Type of stream
     * @param provider Subscriber or Publisher
     */
    addStream(type: StreamType, provider: T): void;
    /**
     * Adds the stream
     * @param type Type of stream
     * @param provider Subscriber or Publisher
     */
    removeStream(type: StreamType, provider: T): void;
    getStream(id: string): T;
    /**
     * Clears all streams from state
     */
    reset(): void;
}
