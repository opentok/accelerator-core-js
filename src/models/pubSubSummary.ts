import OT from '@opentok/client';
import { StreamCollection } from './streamCollection';
import { StreamCollectionSummary } from './streamCollectionSummary';

export class PubSubSummary {
  public publisher: StreamCollectionSummary;
  public subscriber: StreamCollectionSummary;

  constructor(
    publishers: StreamCollection<OT.Publisher>,
    subscribers: StreamCollection<OT.Subscriber>
  ) {
    this.publisher = publishers.getCount();
    this.subscriber = subscribers.getCount();
  }
}
