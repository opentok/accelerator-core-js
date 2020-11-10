// eslint-disable-next-line no-console
export const message = (messageText: string): void => {
  console.log(`otAccCore: ${messageText}`);
};

/**
 * Wraps DOM selector methods
 */
export abstract class dom {
  /**
   * Returns document.querySelector
   * @param arg selector to query for
   */
  public static query(arg: string): Element | Element[] | undefined {
    return document.querySelector(arg);
  }

  /**
   * Returns document.getElementById
   * @param arg id to query for
   */
  public static id(arg: string): Element | undefined {
    return document.getElementById(arg);
  }

  /**
   * Returns document.getElementsByClassName
   * @param arg class to query for
   */
  public static class(arg: string): HTMLCollectionOf<Element> | undefined {
    return document.getElementsByClassName(arg);
  }

  /**
   * Returns query or the provided element
   * @param el
   */
  public static element(el: string | Element): Element | Element[] | undefined {
    return typeof el === 'string' ? this.query(el) : el;
  }
}

/**
 * Returns a (nested) property from an object, or undefined if it doesn't exist
 * @param props An array of properties or a single property
 * @param obj Object to search
 */
export const path = (
  props: string | string[],
  obj: unknown | []
): string | unknown => {
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
 * Checks for a (nested) property in an object and returns the property if
 * it exists.  Otherwise, it returns a default value.
 * @param defaultValue Default value
 * @param props An array of properties or a single property
 * @param obj Object to search
 */
export const pathOr = (
  defaultValue: unknown,
  props: string | [],
  obj: unknown | []
): unknown => {
  const value = path(props, obj);
  return value === undefined ? defaultValue : value;
};

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param text Text to transform
 */
export const properCase = (text: string): string => {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
};
