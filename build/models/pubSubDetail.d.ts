import OT from '@opentok/client';
import { PubSubSummary } from './pubSubSummary';
import { StreamCollection } from './streamCollection';
export declare class PubSubDetail {
    publishers: StreamCollection<OT.Publisher>;
    subscribers: StreamCollection<OT.Subscriber>;
    meta: PubSubSummary;
    constructor(publishers: StreamCollection<OT.Publisher>, subscribers: StreamCollection<OT.Subscriber>);
}
