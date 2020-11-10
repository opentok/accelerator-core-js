/**
 * Defines errors emitted from the SDK
 */
export default class SDKError extends Error {
  constructor(
    source: string,
    errorMessage: string,
    errorName: string,
    stack?: string
  ) {
    super(`${source}: ${errorMessage}`);
    this.name = errorName;
    this.stack = stack;
  }
}
