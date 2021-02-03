import OT from '@opentok/client';
import { StreamCollection } from './streamCollection';
import { StreamCollectionSummary } from './streamCollectionSummary';
export declare class PubSubSummary {
    publisher: StreamCollectionSummary;
    subscriber: StreamCollectionSummary;
    constructor(publishers: StreamCollection<OT.Publisher>, subscribers: StreamCollection<OT.Subscriber>);
}
