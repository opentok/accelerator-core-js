import { Credential } from '../credential';
import { StreamType } from '../streamCollectionSummary';
import { CoreAnnotationOptions } from './coreAnnotationOptions';
import { CoreArchivingOptions } from './coreArchivingOptions';
import { CoreCommunicationOptions } from './coreCommunicationOptions';
import { CoreScreenSharingOptions } from './coreScreenSharingOptions';
import { CoreTextChatOptions } from './coreTextChatOptions';
export declare class CoreOptions {
    credentials: Credential;
    controlsContainer?: string | Element;
    packages?: [string];
    streamContainers?: (pubSub: 'publisher' | 'subscriber', type: StreamType, data?: unknown, streamId?: string) => string | Element;
    largeScale: boolean;
    applicationName?: string;
    annotation?: CoreAnnotationOptions;
    archiving?: CoreArchivingOptions;
    communication?: CoreCommunicationOptions;
    textChat?: CoreTextChatOptions;
    screenSharing?: CoreScreenSharingOptions;
    constructor(credentials: Credential, controlsContainer?: string | Element, packages?: [string], streamContainers?: (pubSub: 'publisher' | 'subscriber', type: StreamType, data?: unknown, streamId?: string) => string | Element, largeScale?: boolean, applicationName?: string, annotation?: CoreAnnotationOptions, archiving?: CoreArchivingOptions, communication?: CoreCommunicationOptions, textChat?: CoreTextChatOptions, screenSharing?: CoreScreenSharingOptions);
}
