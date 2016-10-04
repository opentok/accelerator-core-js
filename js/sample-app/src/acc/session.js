// Map publisher ids to publisher objects
const publishers = {
  camera: {},
  screen: {},
};

// Map subscriber id to subscriber objects
const subscribers = {
  camera: {},
  screen: {},
};

// Map stream ids to stream objects
const streams = {};

// Map stream ids to subscriber ids
const streamMap = {};


const pubSubCount = () => {
  const pubs = Object.keys(publishers).reduce((acc, source) => {
    acc[source] = Object.keys(publishers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  const subs = Object.keys(subscribers).reduce((acc, source) => {
    acc[source] = Object.keys(subscribers[source]).length;
    acc.total += acc[source];
    return acc;
  }, { camera: 0, screen: 0, total: 0 });

  return { publisher: pubs, subscriber: subs };
};

/**
 * Returns the current publishers and subscribers, along with a count of each
 */
const currentPubSub = () => ({ publishers, subscribers, meta: pubSubCount() });



const addPublisher = publisher => {
  const type = publisher.stream.videoType;
  streamMap[publisher.stream.id] = publisher.id;
  publishers[type][publisher.id] = publisher;
};

const removePublisher = publisher => {
  const type = publisher.stream.videoType;
  delete publishers[type][publisher.id];
};

const addStream = stream => {
  streams[stream.id] = stream;
};

const removeStream = stream => {
  const type = stream.videoType;
  const subscriberId = streamMap[stream.id];
  delete streamMap[stream.id];
  delete subscribers[type][subscriberId];
  delete streams[stream.id];
};
