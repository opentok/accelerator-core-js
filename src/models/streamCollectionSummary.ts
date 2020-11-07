export class StreamCollectionSummary {
  constructor(
    public camera: number,
    public screen: number,
    public custom: number,
    public sip: number
  ) {}

  total(): number {
    return this.camera + this.screen + this.sip;
  }
}

export enum StreamType {
  Camera = 'camera',
  Custom = 'custom',
  Screen = 'screen',
  SIP = 'sip'
}
