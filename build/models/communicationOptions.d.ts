import { CoreCommunicationOptions } from './core-options';
import Analytics from '../analytics';
import AccCore from '../core';
import { StreamType } from './streamCollectionSummary';
export declare class CommunicationOptions {
    analytics: Analytics;
    core: AccCore;
    session: OT.Session;
    appendControl: boolean;
    controlsContainer: string;
    coreCommunicationOptions?: CoreCommunicationOptions;
    streamContainers?: (pubSub: 'publisher' | 'subscriber', type: StreamType, data?: unknown, streamId?: string) => string | Element;
    constructor(analytics: Analytics, core: AccCore, session: OT.Session, appendControl: boolean, controlsContainer: string, coreCommunicationOptions?: CoreCommunicationOptions, streamContainers?: (pubSub: 'publisher' | 'subscriber', type: StreamType, data?: unknown, streamId?: string) => string | Element);
}
