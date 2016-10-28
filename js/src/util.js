/** Wrap DOM selector methods:
 * document.querySelector,
 * document.getElementById,
 * document.getElementsByClassName]
 */
const dom = {
  query(arg) {
    return document.querySelector(arg);
  },
  id(arg) {
    return document.getElementById(arg);
  },
  class(arg) {
    return document.getElementsByClassName(arg);
  },
};

/**
 * Returns a (nested) propery from an object, or undefined if it doesn't exist
 * @param {String | Array} props - An array of properties or a single property
 * @param {Object | Array} obj
 */
const path = (props, obj) => {
  let nested = obj;
  const properties = typeof props === 'string' ? props.split('.') : props;

  for (const property of properties) {
    nested = nested[property];
    if (nested === undefined) {
      return nested;
    }
  }

  return nested;
};

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param {String} text
 * @returns {String}
 */
const properCase = text => `${text[0].toUpperCase()}${text.slice(1)}`;

module.exports = {
  dom,
  path,
  properCase,
};
