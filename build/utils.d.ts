export declare const message: (messageText: string) => void;
/**
 * Wraps DOM selector methods
 */
export declare abstract class dom {
    /**
     * Returns document.querySelector
     * @param arg selector to query for
     */
    static query(arg: string): Element | Element[] | undefined;
    /**
     * Returns document.getElementById
     * @param arg id to query for
     */
    static id(arg: string): Element | undefined;
    /**
     * Returns document.getElementsByClassName
     * @param arg class to query for
     */
    static class(arg: string): HTMLCollectionOf<Element> | undefined;
    /**
     * Returns query or the provided element
     * @param el
     */
    static element(el: string | Element): Element | Element[] | undefined;
}
/**
 * Returns a (nested) property from an object, or undefined if it doesn't exist
 * @param props An array of properties or a single property
 * @param obj Object to search
 */
export declare const path: (props: string | string[], obj: unknown | []) => string | unknown;
/**
 * Checks for a (nested) property in an object and returns the property if
 * it exists.  Otherwise, it returns a default value.
 * @param defaultValue Default value
 * @param props An array of properties or a single property
 * @param obj Object to search
 */
export declare const pathOr: (defaultValue: unknown, props: string | [], obj: unknown | []) => unknown;
/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param text Text to transform
 */
export declare const properCase: (text: string) => string;
