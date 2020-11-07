/**
 * Defines errors emitted from the SDK
 */
export default class SDKError extends Error {
  constructor(
    public errorMessage: string,
    public errorName: string,
    public stack?: string
  ) {
    super(`otSDK: ${errorMessage}`);
    this.name = errorName;
    this.stack = stack;
  }
}
