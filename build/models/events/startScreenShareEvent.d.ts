import { PubSubDetail } from '../pubSubDetail';
export declare class StartScreenShareEvent extends PubSubDetail {
    publisher: OT.Publisher;
    constructor(publisher: OT.Publisher, pubSubDetail: PubSubDetail);
}
