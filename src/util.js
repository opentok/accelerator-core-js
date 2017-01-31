/** Wrap DOM selector methods:
 *  document.querySelector,
 *  document.getElementById,
 *  document.getElementsByClassName
 *  'element' checks for a string before returning an element with `query`
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
  element(el) {
    return typeof el === 'string' ? this.query(el) : el;
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
 * Checks for a (nested) propery in an object and returns the property if
 * it exists.  Otherwise, it returns a default value.
 * @param {*} d - Default value
 * @param {String | Array} props - An array of properties or a single property
 * @param {Object | Array} obj
 */
const pathOr = (d, props, obj) => {
  const value = path(props, obj);
  return value === undefined ? d : value;
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
  pathOr,
  properCase,
};
