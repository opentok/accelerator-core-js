"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = __importDefault(require("./sdk-wrapper/errors"));
var utils_1 = require("./utils");
var constants_1 = require("./constants");
var models_1 = require("./models");
var enums_1 = require("./enums");
/**
 *
 */
var Communication = /** @class */ (function () {
    function Communication(options) {
        var _this = this;
        this.active = false;
        this.validateOptions = function (options) {
            var _a, _b, _c;
            var requiredOptions = ['core', 'analytics', 'session'];
            requiredOptions.forEach(function (option) {
                if (!options[option]) {
                    throw new errors_1.default('otAccCore', option + " is a required option.", 'invalidParameters');
                }
            });
            _this.core = options.core;
            _this.OpenTokSDK = _this.core.OpenTokSDK;
            _this.analytics = options.analytics;
            _this.streamContainers = options.streamContainers;
            _this.connectionLimit = (_a = options.coreCommunicationOptions) === null || _a === void 0 ? void 0 : _a.connectionLimit;
            _this.autoSubscribe =
                (options.coreCommunicationOptions &&
                    options.coreCommunicationOptions.autoSubscribe) ||
                    true;
            _this.subscribeOnly =
                (options.coreCommunicationOptions &&
                    options.coreCommunicationOptions.subscribeOnly) ||
                    false;
            _this.callProperties = Object.assign({}, constants_1.defaultCallProperties, (_b = options.coreCommunicationOptions) === null || _b === void 0 ? void 0 : _b.callProperties);
            _this.screenProperties = Object.assign({}, constants_1.defaultCallProperties, { videoSource: 'window' }, (_c = options.coreCommunicationOptions) === null || _c === void 0 ? void 0 : _c.screenProperties);
        };
        /**
         * Trigger an event through the API layer
         * @param event The name of the event
         * @param data
         */
        this.triggerEvent = function (event, data) {
            return _this.core.triggerEvent(event, data);
        };
        /**
         * Determine whether or not the party is able to join the call based on
         * the specified connection limit, if any.
         */
        this.ableToJoin = function () {
            if (!_this.connectionLimit) {
                return true;
            }
            // Not using the session here since we're concerned with number of active publishers
            var connections = Object.values(_this.OpenTokSDK.getStreams()).filter(function (s) { return s.videoType === models_1.StreamType.Camera; });
            return connections.length < _this.connectionLimit;
        };
        /**
         * Publish the local camera stream and update state
         * @param publisherProperties Properties of the published stream
         */
        this.publish = function (publisherProperties) { return __awaiter(_this, void 0, void 0, function () {
            var props, container, publisher, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        /**
                         * For subscriber tokens or cases where we just don't want to be seen or heard.
                         */
                        if (this.subscribeOnly) {
                            utils_1.message('Instance is configured with subscribeOnly set to true. Cannot publish to session');
                            return [2 /*return*/, undefined];
                        }
                        this.analytics.log(enums_1.LogAction.startCall, enums_1.LogVariation.attempt);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        props = Object.assign({}, this.callProperties, publisherProperties);
                        container = utils_1.dom.element(this.streamContainers('publisher', models_1.StreamType.Camera));
                        return [4 /*yield*/, this.OpenTokSDK.publish(container, props)];
                    case 2:
                        publisher = _a.sent();
                        this.OpenTokSDK.addPublisher(models_1.StreamType.Camera, publisher);
                        return [2 /*return*/, publisher];
                    case 3:
                        error_1 = _a.sent();
                        this.analytics.log(enums_1.LogAction.startCall, enums_1.LogVariation.fail);
                        errorMessage = error_1.code === 1010 ? 'Check your network connection' : error_1.message;
                        this.triggerEvent('error', errorMessage);
                        return [2 /*return*/, undefined];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Subscribe to a stream and update the state
         * @param stream An OpenTok stream object
         * @param subsriberOptions Specific options for this subscriber
         * @param networkTest Are we subscribing to our own publisher for a network test?
         */
        this.subscribe = function (stream, subscriberProperties, networkTest) {
            if (networkTest === void 0) { networkTest = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var streamMap, type, connectionData, container, options, subscriber, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.analytics.log(enums_1.LogAction.subscribe, enums_1.LogVariation.attempt);
                            streamMap = this.OpenTokSDK.getStreamMap();
                            type = stream.videoType || models_1.StreamType.SIP;
                            if (!(streamMap[stream.streamId] && !networkTest)) return [3 /*break*/, 1];
                            // Are we already subscribing to the stream?
                            return [2 /*return*/, this.OpenTokSDK.getSubscriber(stream.streamId)];
                        case 1:
                            connectionData = void 0;
                            try {
                                connectionData = JSON.parse(stream.connection.data || null);
                            }
                            catch (e) {
                                connectionData = stream.connection.data;
                            }
                            container = utils_1.dom.element(this.streamContainers('subscriber', type, connectionData, stream.streamId));
                            options = Object.assign({}, type === models_1.StreamType.Camera || type === models_1.StreamType.SIP
                                ? this.callProperties
                                : this.screenProperties, subscriberProperties);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.OpenTokSDK.subscribe(stream, container, options)];
                        case 3:
                            subscriber = _a.sent();
                            this.triggerEvent("subscribeTo" + utils_1.properCase(type), Object.assign({}, { subscriber: subscriber }, this.OpenTokSDK.all()));
                            this.analytics.log(enums_1.LogAction.subscribe, enums_1.LogVariation.success);
                            return [2 /*return*/, subscriber];
                        case 4:
                            error_2 = _a.sent();
                            this.analytics.log(enums_1.LogAction.subscribe, enums_1.LogVariation.fail);
                            return [2 /*return*/, Promise.reject(error_2)];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Unsubscribe from a stream and update the state
         * @param subscriber An OpenTok subscriber object
         */
        this.unsubscribe = function (subscriber) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.analytics.log(enums_1.LogAction.unsubscribe, enums_1.LogVariation.attempt);
                        return [4 /*yield*/, this.OpenTokSDK.unsubscribe(subscriber)];
                    case 1:
                        _a.sent();
                        this.analytics.log(enums_1.LogAction.unsubscribe, enums_1.LogVariation.success);
                        return [2 /*return*/];
                }
            });
        }); };
        /**
         * Subscribe to new stream unless autoSubscribe is set to false
         * @param streamEvent An OpenTok event with a stream property
         */
        this.onStreamCreated = function (streamEvent) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.active &&
                            this.autoSubscribe &&
                            streamEvent.stream;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.subscribe(streamEvent.stream)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        _a;
                        return [2 /*return*/];
                }
            });
        }); };
        /**
         * Update state and trigger corresponding event(s) when stream is destroyed
         * @param streamEvent An OpenTok event with a stream property
         */
        this.onStreamDestroyed = function (streamEvent) {
            var type = streamEvent.stream.videoType || models_1.StreamType.SIP;
            _this.triggerEvent("unsubscribeFrom" + utils_1.properCase(type), _this.OpenTokSDK.getPubSub());
        };
        /**
         * Listen for API-level events
         */
        this.createEventListeners = function () {
            _this.core.on(enums_1.OpenTokEvents.StreamCreated, _this.onStreamCreated);
            _this.core.on(enums_1.OpenTokEvents.StreamDestroyed, _this.onStreamDestroyed);
        };
        /**
         * Start publishing the local camera feed and subscribing to streams in the session
         * @param publisherProperties Properties for this specific publisher
         */
        this.startCall = function (publisherProperties) { return __awaiter(_this, void 0, void 0, function () {
            var initialStreams, errorMessage, publisher, initialSubscriptions, pubSubData, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.analytics.log(enums_1.LogAction.startCall, enums_1.LogVariation.attempt);
                        this.active = true;
                        initialStreams = this.OpenTokSDK.getStreams();
                        /**
                         * Determine if we're able to join the session based on an existing connection limit
                         */
                        if (!this.ableToJoin()) {
                            errorMessage = 'Session has reached its connection limit';
                            this.triggerEvent('error', errorMessage);
                            this.analytics.log(enums_1.LogAction.startCall, enums_1.LogVariation.fail);
                            return [2 /*return*/, Promise.reject(new errors_1.default('otCore', errorMessage, 'connectionLimit'))];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.publish(publisherProperties)];
                    case 2:
                        publisher = _a.sent();
                        initialSubscriptions = function () {
                            if (_this.autoSubscribe) {
                                return Object.values(initialStreams).map(function (stream) {
                                    return _this.subscribe(stream);
                                });
                            }
                            return [Promise.resolve()];
                        };
                        return [4 /*yield*/, Promise.all(initialSubscriptions())];
                    case 3:
                        _a.sent();
                        pubSubData = Object.assign({}, this.OpenTokSDK.getPubSub(), {
                            publisher: publisher
                        });
                        this.triggerEvent('startCall', pubSubData);
                        return [2 /*return*/, pubSubData];
                    case 4:
                        error_3 = _a.sent();
                        utils_1.message("Failed to subscribe to all existing streams: " + error_3);
                        // We do not reject here in case we still successfully publish to the session
                        return [2 /*return*/, Object.assign({}, this.OpenTokSDK.getPubSub(), { publisher: publisher })];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Stop publishing and unsubscribe from all streams
         */
        this.endCall = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, publishers, subscribers, unpublish, unsubscribeFromAll;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.analytics.log(enums_1.LogAction.endCall, enums_1.LogVariation.attempt);
                        _a = this.OpenTokSDK.getPubSub(), publishers = _a.publishers, subscribers = _a.subscribers;
                        unpublish = function (publisher) { return _this.OpenTokSDK.unpublish(publisher); };
                        Object.values(publishers.camera).forEach(unpublish);
                        Object.values(publishers.screen).forEach(unpublish);
                        unsubscribeFromAll = function (subscriberCollection) {
                            var subscribers = __assign(__assign({}, subscriberCollection.camera), subscriberCollection.screen);
                            return Object.values(subscribers).map(function (subscriber) {
                                return _this.unsubscribe(subscriber);
                            });
                        };
                        return [4 /*yield*/, Promise.all(unsubscribeFromAll(subscribers))];
                    case 1:
                        _b.sent();
                        this.active = false;
                        this.triggerEvent('endCall', null);
                        this.analytics.log(enums_1.LogAction.endCall, enums_1.LogVariation.success);
                        return [2 /*return*/];
                }
            });
        }); };
        /**
         * Enable/disable local audio or video
         * @param id
         * @param source 'audio' or 'video'
         * @param enable Whether to device is enabled or not
         */
        this.enableLocalAV = function (id, source, enable) {
            var method = "publish" + utils_1.properCase(source);
            var publishers = _this.OpenTokSDK.getPubSub().publishers;
            var publisher = publishers.camera[id] || publishers.screen[id];
            publisher[method](enable);
        };
        /**
         * Enable/disable remote audio or video
         * @param subscriberId
         * @param source 'audio' or 'video'
         * @param enable
         */
        this.enableRemoteAV = function (subscriberId, source, enable) {
            var method = "subscribeTo" + utils_1.properCase(source);
            var subscribers = _this.OpenTokSDK.getPubSub().subscribers;
            var subscriber = subscribers.camera[subscriberId] || subscribers.sip[subscriberId];
            subscriber[method](enable);
        };
        this.validateOptions(options);
        this.createEventListeners();
    }
    return Communication;
}());
exports.default = Communication;
//# sourceMappingURL=communication.js.map