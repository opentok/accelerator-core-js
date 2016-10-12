"use strict";

// eslint-disable-next-line no-console
var message = function message(_message) {
  return console.log("otAccCore: " + _message);
};

var error = function error(message) {
  throw new Error("otAccCore: " + message);
};

module.exports = {
  message: message,
  error: error
};