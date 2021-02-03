export declare class StreamCollectionSummary {
    camera: number;
    screen: number;
    custom: number;
    sip: number;
    constructor(camera: number, screen: number, custom: number, sip: number);
    total(): number;
}
export declare enum StreamType {
    Camera = "camera",
    Custom = "custom",
    Screen = "screen",
    SIP = "sip"
}
