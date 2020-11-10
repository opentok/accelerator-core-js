import { CoreCommunicationOptions } from './core-options';
import Analytics from '../analytics';

export class CommunicationOptions {
  constructor(
    public analytics: Analytics,
    public core: any,
    public session: OT.Session,
    public state: any,
    public appendControl?: any,
    public controlsContainer?: any,
    public coreCommunicationOptions?: CoreCommunicationOptions,
    public streamContainers?: any
  ) {}
}
