'use strict';

/** Wrap DOM selector methods:
 * document.querySelector,
 * document.getElementById,
 * document.getElementsByClassName]
 */
var dom = {
  query: function query(arg) {
    return document.querySelector(arg);
  },
  id: function id(arg) {
    return document.getElementById(arg);
  },
  class: function _class(arg) {
    return document.getElementsByClassName(arg);
  }
};

/**
 * Returns a (nested) propery from an object, or undefined if it doesn't exist
 * @param {String | Array} props - An array of properties or a single property
 * @param {Object | Array} obj
 */
var path = function path(props, obj) {
  var nested = obj;
  var properties = typeof props === 'string' ? props.split('.') : props;

  for (var i = 0; i < properties.length; i++) {
    nested = nested[properties[i]];
    if (nested === undefined) {
      return nested;
    }
  }

  return nested;
};

module.exports = {
  dom: dom,
  path: path
};