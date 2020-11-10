import { Credential } from '../credential';
import { StreamType } from '../streamCollectionSummary';
import { CoreAnnotationOptions } from './coreAnnotationOptions';
import { CoreArchivingOptions } from './coreArchivingOptions';
import { CoreCommunicationOptions } from './coreCommunicationOptions';
import { CoreScreenSharingOptions } from './coreScreenSharingOptions';
import { CoreTextChatOptions } from './coreTextChatOptions';

export class CoreOptions {
  constructor(
    public credentials: Credential,
    public controlsContainer?: string | Element,
    public packages?: [string],
    public streamContainers?: (
      pubSub: 'publisher' | 'subscriber',
      type: StreamType,
      data?: unknown,
      streamId?: string
    ) => string | Element,
    public largeScale: boolean = false,
    public applicationName?: string,

    public annotation?: CoreAnnotationOptions,
    public archiving?: CoreArchivingOptions,
    public communication?: CoreCommunicationOptions,
    public textChat?: CoreTextChatOptions,
    public screenSharing?: CoreScreenSharingOptions
  ) {}
}
