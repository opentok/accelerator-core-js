import { Credential } from '../';
import { StreamType } from '../streamCollectionSummary';
import { AnnotationOptions } from './annotationOptions';
import { ArchivingOptions } from './archivingOptions';
import { CommunicationOptions } from './communicationOptions';
import { ScreenSharingOptions } from './screenSharingOptions';
import { TextChatOptions } from './textChatOptions';

export class Options {
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

    public annotation?: AnnotationOptions,
    public archiving?: ArchivingOptions,
    public communication?: CommunicationOptions,
    public textChat?: TextChatOptions,
    public screenSharing?: ScreenSharingOptions
  ) {}
}
