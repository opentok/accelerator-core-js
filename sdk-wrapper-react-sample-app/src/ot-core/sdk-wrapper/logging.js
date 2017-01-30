"use strict";

// eslint-disable-next-line no-console
var message = function message(messageText) {
  return console.log("otSDK: " + messageText);
};

var error = function error(errorMessage) {
  throw new Error("otSDK: " + errorMessage);
};

module.exports = {
  message: message,
  error: error
};