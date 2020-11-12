import { PubSubDetail } from '../pubSubDetail';

export class EndScreenShareEvent extends PubSubDetail {
  constructor(pubSubDetail: PubSubDetail) {
    super(pubSubDetail.publishers, pubSubDetail.subscribers);
  }
}
