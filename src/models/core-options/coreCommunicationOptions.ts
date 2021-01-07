export class CoreCommunicationOptions {
  constructor(
    public autoSubscribe: boolean = true,
    public callProperties?: OT.PublisherProperties,
    public connectionLimit: number = null,
    public screenProperties?: unknown,
    public subscribeOnly: boolean = false
  ) {}
}
