// eslint-disable-next-line no-console
const message = messageText => console.log(`otSDK: ${messageText}`);

const error = (errorMessage) => {
  throw new Error(`otSDK: ${errorMessage}`);
};

module.exports = {
  message,
  error,
};

