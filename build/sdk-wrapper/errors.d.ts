/**
 * Defines errors emitted from the SDK
 */
export declare class SDKError extends Error {
    constructor(source: string, errorMessage: string, errorName: string, stack?: string);
}
