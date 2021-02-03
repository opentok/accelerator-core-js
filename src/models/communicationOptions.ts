import { CoreCommunicationOptions } from './core-options';
import { Analytics } from '../analytics';
import { AccCore } from '../core';
import { StreamType } from './streamCollectionSummary';

export class CommunicationOptions {
  constructor(
    public analytics: Analytics,
    public core: AccCore,
    public session: OT.Session,
    public appendControl: boolean,
    public controlsContainer: string,
    public coreCommunicationOptions?: CoreCommunicationOptions,
    public streamContainers?: (
      pubSub: 'publisher' | 'subscriber',
      type: StreamType,
      data?: unknown,
      streamId?: string
    ) => string | Element
  ) {}
}
