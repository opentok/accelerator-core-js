// eslint-disable-next-line no-console
const log = message => console.log(`otAccCore: ${message}`);

const error = (message) => {
  throw new Error(`otAccCore: ${message}`);
};

module.exports = {
  log,
  error,
};

