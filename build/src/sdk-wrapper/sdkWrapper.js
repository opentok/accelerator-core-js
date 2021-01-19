"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = __importDefault(require("./errors"));
var state_1 = __importDefault(require("./state"));
var models_1 = require("../models");
var enums_1 = require("../enums");
var OpenTokSDK = /** @class */ (function (_super) {
    __extends(OpenTokSDK, _super);
    function OpenTokSDK(credentials, sessionOptions) {
        var _this = _super.call(this, credentials) || this;
        /**
         * Bind and set event listeners
         * @param target An OpenTok session, publisher, or subscriber object
         * @param context The context to which to bind event listeners
         * @param listeners An object (or array of objects) with eventName/callback k/v pairs
         */
        _this.bindListeners = function (target, context, listeners) {
            /**
             * Create listeners from an object with event/callback k/v pairs
             * @param listeners
             */
            var createListenersFromObject = function (eventListeners) {
                Object.keys(eventListeners).forEach(function (event) {
                    _this.bindListener(target, context, event, eventListeners[event]);
                });
            };
            if (Array.isArray(listeners)) {
                listeners.forEach(function (listener) { return createListenersFromObject(listener); });
            }
            else {
                createListenersFromObject(listeners);
            }
        };
        var session = OT.initSession(credentials.apiKey, credentials.sessionId, sessionOptions);
        if (session) {
            _this.setSession(session);
        }
        return _this;
    }
    /**
     * Determines if a connection object is my local connection
     * @param connection An OpenTok connection object
     */
    OpenTokSDK.prototype.isMe = function (connection) {
        var session = this.getSession();
        return (session && session.connection.connectionId === connection.connectionId);
    };
    /**
     * Wrap OpenTok session events
     */
    OpenTokSDK.prototype.setInternalListeners = function () {
        var _this = this;
        var session = this.getSession();
        if (session) {
            /**
             * Wrap session events and update state when streams are created
             * or destroyed
             */
            session.on(enums_1.OpenTokEvents.StreamCreated, function (_a) {
                var stream = _a.stream;
                return _this.addStream(stream);
            });
            session.on(enums_1.OpenTokEvents.StreamDestroyed, function (_a) {
                var stream = _a.stream;
                return _this.removeStream(stream);
            });
            session.on(enums_1.OpenTokEvents.SessionConnected + " " + enums_1.OpenTokEvents.SessionReconnected, function () { return _this.setConnected(true); });
            session.on(enums_1.OpenTokEvents.SessionDisconnected, function () {
                return _this.setConnected(false);
            });
        }
    };
    /**
     * Register a callback for a specific event, pass an object
     * with event => callback key/values (or an array of objects)
     * to register callbacks for multiple events.
     * @param events The name of the events
     * @param callback
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#on
     */
    OpenTokSDK.prototype.on = function (events, callback) {
        var session = this.getSession();
        if (session) {
            if (typeof events !== 'string') {
                this.bindListeners(session, this, events);
            }
            else if (callback) {
                console.log("on: " + events);
                this.bindListener(session, this, events, callback);
            }
        }
    };
    /**
     * Remove a callback for a specific event. If no parameters are passed,
     * all callbacks for the session will be removed.
     * @param events The name of the events
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#off
     */
    OpenTokSDK.prototype.off = function () {
        var events = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            events[_i] = arguments[_i];
        }
        var session = this.getSession();
        if (session) {
            session.off.apply(session, __spread(events));
        }
    };
    /**
     * Enable or disable local publisher audio
     * @param enabled Is audio published?
     */
    OpenTokSDK.prototype.enablePublisherAudio = function (enabled) {
        var publishers = this.getPublishers(models_1.StreamType.Camera);
        publishers.forEach(function (publisher) { return publisher.publishAudio(enabled); });
    };
    /**
     * Enable or disable local publisher video
     * @param enabled Is video published?
     */
    OpenTokSDK.prototype.enablePublisherVideo = function (enabled) {
        var publishers = this.getPublishers(models_1.StreamType.Camera);
        publishers.forEach(function (publisher) { return publisher.publishVideo(enabled); });
    };
    /**
     * Enable or disable local subscriber audio
     * @param streamId Stream Id to enable/disable
     * @param enabled Is audio enabled?
     */
    OpenTokSDK.prototype.enableSubscriberAudio = function (streamId, enabled) {
        var subscriber = this.getSubscriber(streamId);
        if (subscriber) {
            subscriber.subscribeToAudio(enabled);
        }
    };
    /**
     * Enable or disable local subscriber video
     * @param streamId Stream Id to enable/disable
     * @param enabled Is audio enabled?
     */
    OpenTokSDK.prototype.enableSubscriberVideo = function (streamId, enabled) {
        var subscriber = this.getSubscriber(streamId);
        if (subscriber) {
            subscriber.subscribeToVideo(enabled);
        }
    };
    /**
     * Create and publish a stream
     * @param element The target element
     * @param properties The publisher properties
     * @param eventListeners An object with eventName/callback key/value pairs
     * @param preview Create a publisher without publishing to the session
     */
    OpenTokSDK.prototype.publish = function (element, properties, eventListeners, preview) {
        if (eventListeners === void 0) { eventListeners = null; }
        if (preview === void 0) { preview = false; }
        return __awaiter(this, void 0, void 0, function () {
            var publisher;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initPublisher(element, properties)];
                    case 1:
                        publisher = _a.sent();
                        if (eventListeners) {
                            this.bindListeners(publisher, this, eventListeners);
                        }
                        if (!preview) return [3 /*break*/, 2];
                        return [2 /*return*/, publisher];
                    case 2: return [4 /*yield*/, this.publishPreview(publisher)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Publish a 'preview' stream to the session
     * @param publisher An OpenTok publisher object
     */
    OpenTokSDK.prototype.publishPreview = function (publisher) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var session = _this.getSession();
                            if (session) {
                                session.publish(publisher, function (error) {
                                    if (error) {
                                        reject(error);
                                    }
                                    _this.addPublisher(publisher.stream.videoType, publisher);
                                    resolve(publisher);
                                });
                            }
                            else {
                                reject('Unable to publish without an active connection to a session');
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Stop publishing a stream
     * @param publisher An OpenTok publisher object
     */
    OpenTokSDK.prototype.unpublish = function (publisher) {
        var type = publisher.stream.videoType;
        var session = this.getSession();
        if (session) {
            session.unpublish(publisher);
        }
        this.removePublisher(type, publisher);
    };
    /**
     * Subscribe to stream
     * @param stream OpenTok stream to subscribe to
     * @param container The id of the container or a reference to the element
     * @param properties Settings to use in the subscription of the stream
     * @param eventListeners An object eventName/callback key/value pairs
     * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
     */
    OpenTokSDK.prototype.subscribe = function (stream, container, properties, eventListeners) {
        if (eventListeners === void 0) { eventListeners = null; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var session = _this.getSession();
                            if (session) {
                                var subscriber_1 = session.subscribe(stream, container, properties, function (error) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        _this.addSubscriber(subscriber_1);
                                        if (eventListeners) {
                                            _this.bindListeners(subscriber_1, _this, eventListeners);
                                        }
                                        resolve(subscriber_1);
                                    }
                                });
                            }
                            else {
                                reject('Unable to subscribe to a stream when not connected to a session');
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Unsubscribe from a stream and update the state
     * @param subscriber An OpenTok subscriber object
     */
    OpenTokSDK.prototype.unsubscribe = function (subscriber) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var session = _this.getSession();
                            _this.removeSubscriber(subscriber);
                            if (session) {
                                session.unsubscribe(subscriber);
                            }
                            resolve();
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Connect to the OpenTok session
     * @param eventListeners An object with eventName/callback key/value pairs
     */
    OpenTokSDK.prototype.connect = function (eventListeners) {
        if (eventListeners === void 0) { eventListeners = null; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.off();
                        this.setInternalListeners();
                        if (eventListeners) {
                            this.on(eventListeners);
                        }
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var credentials = _this.getCredentials();
                                if (credentials && credentials.token) {
                                    var session = _this.getSession();
                                    if (session) {
                                        session.connect(credentials.token, function (error) {
                                            error ? reject(error) : resolve();
                                        });
                                    }
                                }
                                else {
                                    reject('Token not provided');
                                }
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Force a remote connection to leave the session
     * @param connection Connection to disconnect
     */
    OpenTokSDK.prototype.forceDisconnect = function (connection) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var session = _this.getSession();
                            if (session) {
                                session.forceDisconnect(connection, function (error) {
                                    error ? reject(error) : resolve();
                                });
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Force the publisher of a stream to stop publishing the stream
     * @param stream Stream to unpublish
     */
    OpenTokSDK.prototype.forceUnpublish = function (stream) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var session = _this.getSession();
                            if (session) {
                                session.forceUnpublish(stream, function (error) {
                                    error ? reject(error) : resolve();
                                });
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Send a signal using the OpenTok signaling apiKey
     * @param type Message type
     * @param signalData Data to send
     * @param to An OpenTok connection object
     * @see https://tokbox.com/developer/guides/signaling/js/
     */
    OpenTokSDK.prototype.signal = function (type, signalData, to) {
        return __awaiter(this, void 0, void 0, function () {
            var data, signal;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = JSON.stringify(signalData);
                        signal = to ? { type: type, data: data, to: to } : { type: type, data: data };
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var session = _this.getSession();
                                if (session) {
                                    session.signal(signal, function (error) {
                                        error ? reject(error) : resolve();
                                    });
                                }
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Disconnect from the OpenTok session
     */
    OpenTokSDK.prototype.disconnect = function () {
        var session = this.getSession();
        if (session) {
            session.disconnect();
        }
        this.reset();
    };
    /**
     * Return the state of the OpenTok session
     */
    OpenTokSDK.prototype.state = function () {
        return this.all();
    };
    /**
     * Initialize an OpenTok publisher object
     * @param element The target element
     * @param properties The publisher properties
     */
    OpenTokSDK.prototype.initPublisher = function (element, properties) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var publisher = OT.initPublisher(element, properties, function (error) {
                                error ? reject(error) : resolve(publisher);
                            });
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Binds and sets a single event listener on the OpenTok session
     * @param target An OpenTok session, publisher, or subscriber object
     * @param context The context to which to bind event listeners
     * @param event The name of the event
     * @param callback
     */
    OpenTokSDK.prototype.bindListener = function (target, context, event, callback) {
        var paramsError;
        ("'on' requires a string and a function to create an event listener.");
        if (typeof event !== 'string' || typeof callback !== 'function') {
            throw new errors_1.default('otSDK', paramsError, 'invalidParameters');
        }
        target.on(event, function (data) {
            callback(data);
        });
    };
    return OpenTokSDK;
}(state_1.default));
exports.default = OpenTokSDK;
if (typeof window !== 'undefined') {
    window.OpenTokSDK = OpenTokSDK;
}
//# sourceMappingURL=sdkWrapper.js.map