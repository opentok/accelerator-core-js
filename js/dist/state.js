"use strict";

// Map publisher ids to publisher objects
var publishers = {
  camera: {},
  screen: {}
};

// Map subscriber id to subscriber objects
var subscribers = {
  camera: {},
  screen: {}
};

// Map stream ids to stream objects
var streams = {};

// Map stream ids to subscriber/publisher ids
var streamMap = {};

/**
 * Returns the count of current publishers and subscribers by type
 * @retuns {Object}
 *    {
 *      publishers: {
 *        camera: 1,
 *        screen: 1,
 *        total: 2
 *      },
 *      subscribers: {
 *        camera: 3,
 *        screen: 1,
 *        total: 4
 *      }
 *   }
 */
var pubSubCount = function pubSubCount() {
  var pubs = Object.keys(publishers).reduce(function (acc, source) {
    acc[source] = Object.keys(publishers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  var subs = Object.keys(subscribers).reduce(function (acc, source) {
    acc[source] = Object.keys(subscribers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 */
var currentPubSub = function currentPubSub() {
  return { publishers: publishers, subscribers: subscribers, meta: pubSubCount() };
};

var addPublisher = function addPublisher(type, publisher) {
  streamMap[publisher.streamId] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

var removePublisher = function removePublisher(type, publisher) {
  var id = publisher.id || streamMap[publisher.streamId];
  delete publishers[type][id];
};

var removeAllPublishers = function removeAllPublishers() {
  publishers.camera = {};
  publishers.screen = {};
};

var addSubscriber = function addSubscriber(subscriber) {
  var type = subscriber.stream.videoType;
  var streamId = subscriber.stream.id;
  subscribers[type][subscriber.id] = subscriber;
  streamMap[streamId] = subscriber.id;
};

var addStream = function addStream(stream) {
  streams[stream.id] = stream;
};

var removeStream = function removeStream(stream) {
  var type = stream.videoType;
  var subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};

var getStreams = function getStreams() {
  return streams;
};

var all = function all() {
  return Object.assign({}, currentPubSub(), { streams: streams, streamMap: streamMap });
};

module.exports = {
  addStream: addStream,
  removeStream: removeStream,
  getStreams: getStreams,
  addPublisher: addPublisher,
  removePublisher: removePublisher,
  removeAllPublishers: removeAllPublishers,
  addSubscriber: addSubscriber,
  currentPubSub: currentPubSub,
  all: all
};