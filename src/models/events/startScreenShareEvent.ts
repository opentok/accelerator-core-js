import { PubSubDetail } from '../pubSubDetail';

export class StartScreenShareEvent extends PubSubDetail {
  constructor(public publisher: OT.Publisher, pubSubDetail: PubSubDetail) {
    super(pubSubDetail.publishers, pubSubDetail.subscribers);
  }
}
