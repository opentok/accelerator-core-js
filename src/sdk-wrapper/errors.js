/** Errors */
class SDKError extends Error {
  constructor(errorMessage, errorType) {
    super(`otSDK: ${errorMessage}`);
    this.type = errorType;
  }
}

module.exports = {
  SDKError,
};

