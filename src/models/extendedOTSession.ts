export class ExtendedOTSession extends OT.Session {
  constructor(public streams: [OT.Stream], public apiKey?: string) {
    super();
  }
}
