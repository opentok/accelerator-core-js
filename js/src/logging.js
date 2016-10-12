// eslint-disable-next-line no-console
const message = message => console.log(`otAccCore: ${message}`);

const error = (message) => {
  throw new Error(`otAccCore: ${message}`);
};

module.exports = {
  message,
  error,
};

