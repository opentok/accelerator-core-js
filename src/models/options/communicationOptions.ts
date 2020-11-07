export class CommunicationOptions {
  constructor(
    public autoSubscribe: boolean = true,
    public callProperties?: any,
    public connectionLimit: number = null,
    public screenProperties?: any,
    public subscribeOnly: boolean = false
  ) {}
}

// export class PackageCommunicationOptions extends CommunicationOptions {
//   constructor(
//     public connectionLimit: number,
//     public callProperties: any,
//     public screenProperties: any,
//     public session: OT.Session,
//     public core: any,
//     public accPack: any,
//     public controlsContainer: any,
//     public appendControl: any,
//     public state: State,
//     public analytics: any,
//     public autoSubscribe?: boolean,
//     public subscribeOnly?: boolean,
//   ) {
//     super(connectionLimit, callProperties, screenProperties, autoSubscribe, subscribeOnly);
//   }
// }
