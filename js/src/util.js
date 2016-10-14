/** Wrap DOM selector methods:
 * document.querySelector,
 * document.getElementById,
 * document.getElementsByClassName]
 */
const dom = {
  query(...args) {
    return document.querySelector(args);
  },
  id(...args) {
    return document.getElementById(args);
  },
  class(...args) {
    return document.getElementsByClassName(args);
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

  for (let i = 0; i < properties.length; i++) {
    nested = nested[properties[i]];
    if (nested === undefined) {
      return nested;
    }
  }

  return nested;
};

module.exports = {
  dom,
  path,
};
