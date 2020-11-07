import OT from '@opentok/client';
import { PubSubSummary } from './pubSubSummary';
import { StreamCollection } from './streamCollection';

export class PubSubDetail {
  public meta: PubSubSummary;

  constructor(
    public publishers: StreamCollection<OT.Publisher>,
    public subscribers: StreamCollection<OT.Subscriber>
  ) {
    this.meta = new PubSubSummary(this.publishers, this.subscribers);
  }
}
