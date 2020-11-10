"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var models_1 = require("../models");
var errors_1 = __importDefault(require("./errors"));
var State = /** @class */ (function () {
    function State(credentials) {
        this.credentials = null;
        this.publishers = new models_1.StreamCollection();
        this.session = null;
        this.streamMap = {};
        this.streams = {};
        this.subscribers = new models_1.StreamCollection();
        this.validateCredentials(credentials);
    }
    /**
     * Ensures that we have the required credentials
     * @param credentials Credentials for the OpenTok session/user
     */
    State.prototype.validateCredentials = function (credentials) {
        var required = ['apiKey', 'sessionId', 'token'];
        required.forEach(function (credential) {
            if (!credentials[credential]) {
                throw new errors_1.default(credential + " is a required credential", 'invalidParameters');
            }
        });
        this.credentials = credentials;
    };
    /**
     * Sets the current connection state
     * @param connected Whether we're connected to the session or not
     */
    State.prototype.setConnected = function (connected) {
        this.connected = connected;
    };
    /**
     * Gets the current connection state
     */
    State.prototype.getConnected = function () {
        return this.connected;
    };
    /**
     * Get the options defined
     */
    State.prototype.getOptions = function () {
        return this.options;
    };
    /**
     * Set the options defined for core
     * @param options Options to use for the session
     */
    State.prototype.setOptions = function (options) {
        this.options = options;
    };
    /**
     * Gets the current OpenTok session
     */
    State.prototype.getSession = function () {
        return this.session;
    };
    /**
     * Sets the current OpenTok session
     * @param session Current OpenTok session
     */
    State.prototype.setSession = function (session) {
        this.session = session;
    };
    /**
     * Gets the current OpenTok credentials
     */
    State.prototype.getCredentials = function () {
        return this.credentials;
    };
    /**
     * Set the current OpenTok credentials
     * @param credentials OpenTok credentials
     */
    State.prototype.setCredentials = function (credentials) {
        this.validateCredentials(credentials);
    };
    /**
     * Retrieves all streams
     */
    State.prototype.getStreams = function () {
        return this.streams;
    };
    /**
     * Returns the count of current publishers and subscribers by type
     */
    State.prototype.pubSubCount = function () {
        return new models_1.PubSubSummary(this.publishers, this.subscribers);
    };
    /**
     * Returns the current publishers and subscribers, along with a count of each
     */
    State.prototype.getPubSub = function () {
        return new models_1.PubSubDetail(this.publishers, this.subscribers);
    };
    /**
     * Gets a subscriber
     * @param streamId Unique identifier of the stream
     */
    State.prototype.getSubscriber = function (streamId) {
        var id = this.streamMap[streamId];
        if (id) {
            return this.subscribers.getStream(id);
        }
        return undefined;
    };
    /**
     * Gets a subscriber
     * @param streamId Unique identifier of the stream
     */
    State.prototype.getPublisher = function (streamId) {
        var id = this.streamMap[streamId];
        if (id) {
            return this.publishers.getStream(id);
        }
        return undefined;
    };
    /**
     * Gets a subscriber
     * @param type Type of publishers to return
     */
    State.prototype.getPublishers = function (type) {
        return Object.values(this.publishers[type]).map(function (publisher) { return publisher; });
    };
    /**
     * Add publisher to state
     * @param type Type of stream being published
     * @param publisher OpenTok publisher
     */
    State.prototype.addPublisher = function (type, publisher) {
        this.publishers.addStream(type, publisher);
        this.streamMap[publisher.stream.streamId] = publisher.id;
    };
    /**
     * Removes a publisher from state
     * @param type Type of stream being removed
     * @param publisher OpenTok publisher
     */
    State.prototype.removePublisher = function (type, publisher) {
        this.publishers.removeStream(type, publisher);
    };
    /**
     * Removes all publishers
     */
    State.prototype.removeAllPublishers = function () {
        this.publishers.reset();
    };
    /**
     * Adds subscriber
     * @param subscriber Subscriber to add
     */
    State.prototype.addSubscriber = function (subscriber) {
        this.subscribers.addStream(subscriber.stream.videoType, subscriber);
        this.streamMap[subscriber.stream.streamId] = subscriber.id;
    };
    /**
     * Removes a subscriber
     * @param subscriber Subscriber to remove
     */
    State.prototype.removeSubscriber = function (subscriber) {
        this.subscribers.removeStream(subscriber.stream.videoType, subscriber);
    };
    /**
     * Add a stream to state
     * @param stream An OpenTok stream
     */
    State.prototype.addStream = function (stream) {
        this.streams[stream.streamId] = stream;
    };
    /**
     * Remove a stream from state and any associated subscribers
     * @param stream An OpenTok stream object
     */
    State.prototype.removeStream = function (stream) {
        var type = stream.videoType;
        var subscriberId = this.streamMap[stream.streamId];
        delete this.streamMap[stream.streamId];
        delete this.streams[stream.streamId];
        this.removeSubscriber(this.subscribers[type][subscriberId]);
    };
    /**
     * Reset publishers, streams, and subscribers
     */
    State.prototype.reset = function () {
        this.publishers.reset();
        this.subscribers.reset();
        this.streamMap = {};
        this.streams = {};
    };
    /**
     * Returns the contents of state
     */
    State.prototype.all = function () {
        return Object.assign(this.streams, this.streamMap, this.connected, this.getPubSub());
    };
    return State;
}());
exports.default = State;
//# sourceMappingURL=state.js.map