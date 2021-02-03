"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.properCase = exports.pathOr = exports.path = exports.dom = exports.message = void 0;
// eslint-disable-next-line no-console
exports.message = function (messageText) {
    console.log("otAccCore: " + messageText);
};
/**
 * Wraps DOM selector methods
 */
var dom = /** @class */ (function () {
    function dom() {
    }
    /**
     * Returns document.querySelector
     * @param arg selector to query for
     */
    dom.query = function (arg) {
        return document.querySelector(arg);
    };
    /**
     * Returns document.getElementById
     * @param arg id to query for
     */
    dom.id = function (arg) {
        return document.getElementById(arg);
    };
    /**
     * Returns document.getElementsByClassName
     * @param arg class to query for
     */
    dom.class = function (arg) {
        return document.getElementsByClassName(arg);
    };
    /**
     * Returns query or the provided element
     * @param el
     */
    dom.element = function (el) {
        return typeof el === 'string' ? this.query(el) : el;
    };
    return dom;
}());
exports.dom = dom;
/**
 * Returns a (nested) property from an object, or undefined if it doesn't exist
 * @param props An array of properties or a single property
 * @param obj Object to search
 */
exports.path = function (props, obj) {
    var e_1, _a;
    var nested = obj;
    var properties = typeof props === 'string' ? props.split('.') : props;
    try {
        for (var properties_1 = __values(properties), properties_1_1 = properties_1.next(); !properties_1_1.done; properties_1_1 = properties_1.next()) {
            var property = properties_1_1.value;
            nested = nested[property];
            if (nested === undefined) {
                return nested;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (properties_1_1 && !properties_1_1.done && (_a = properties_1.return)) _a.call(properties_1);
        }
        finally { if (e_1) throw e_1.error; }
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
exports.pathOr = function (defaultValue, props, obj) {
    var value = exports.path(props, obj);
    return value === undefined ? defaultValue : value;
};
/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param text Text to transform
 */
exports.properCase = function (text) {
    return "" + text[0].toUpperCase() + text.slice(1);
};
//# sourceMappingURL=utils.js.map