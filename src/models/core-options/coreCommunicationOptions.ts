export class CoreCommunicationOptions {
  constructor(
    public autoSubscribe: boolean = true,
    public callProperties?: any,
    public connectionLimit: number = null,
    public screenProperties?: any,
    public subscribeOnly: boolean = false
  ) {}
}
