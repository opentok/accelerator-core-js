export declare class ExtendedOTSession extends OT.Session {
    streams: [OT.Stream];
    apiKey?: string;
    constructor(streams: [OT.Stream], apiKey?: string);
}
