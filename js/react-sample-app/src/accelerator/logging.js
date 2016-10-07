"use strict";

// eslint-disable-next-line no-console
var log = function log(message) {
  return console.log("otAccCore: " + message);
};

var error = function error(message) {
  throw new Error("otAccCore: " + message);
};

module.exports = {
  log: log,
  error: error
};