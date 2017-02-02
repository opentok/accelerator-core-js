/** Errors */
class CoreError extends Error {
  constructor(errorMessage, errorType) {
    super(`otAccCore: ${errorMessage}`);
    this.type = errorType;
  }
}

module.exports = {
  CoreError,
};

