# OpenTok Accelerator Core





* * *

### connect() 

Connect to the session

**Returns**: `Promise`, <resolve: -, reject: Error>


### disconnect() 

Disconnect from the session

**Returns**: `Promise`, <resolve: -, reject: Error>


### endCall() 

Stop publishing and unsubscribe from all streams



### forceDisconnect(connection) 

Force a remote connection to leave the session

**Parameters**

**connection**: `Object`, Force a remote connection to leave the session

**Returns**: `Promise`, <resolve: empty, reject: Error>


### forceUnpublish(stream) 

Force the publisher of a stream to stop publishing the stream

**Parameters**

**stream**: `Object`, Force the publisher of a stream to stop publishing the stream

**Returns**: `Promise`, <resolve: empty, reject: Error>


### getAccPack(packageName) 

Get access to an accelerator pack

**Parameters**

**packageName**: `String`, textChat, screenSharing, annotation, or archiving

**Returns**: `Object`, The instance of the accelerator pack


### getCredentials() 

Returns the current OpenTok session credentials

**Returns**: `Object`


### getOptions() 

Returns the options used for initialization

**Returns**: `Object`


### getPublisherForStream(stream) 

Get the local publisher object for a stream

**Parameters**

**stream**: `Object`, An OpenTok stream object

**Returns**: `Object`, - The publisher object


### getSession() 

Get the current OpenTok session object

**Returns**: `Object`


### getSubscribersForStream(stream) 

Get the local subscriber objects for a stream

**Parameters**

**stream**: `Object`, An OpenTok stream object

**Returns**: `Array`, - An array of subscriber object


### init(options) 

Initialize the accelerator pack

**Parameters**

**options**: `Object`, Initialize the accelerator pack

 - **options.credentials**: `Object`, Initialize the accelerator pack

 - **options.packages**: `Array`, Initialize the accelerator pack

 - **options.containers**: `Object`, Initialize the accelerator pack



### off(event, callback) 

Remove a callback for a specific event.  If no parameters are passed,
all event listeners will be removed.

**Parameters**

**event**: `String`, The name of the event

**callback**: `function`, Remove a callback for a specific event.  If no parameters are passed,
all event listeners will be removed.



### on(event, callback) 

Register a callback for a specific event or pass an object with
with event => callback key/value pairs to register listeners for
multiple events.

**Parameters**

**event**: `String | Object`, The name of the event

**callback**: `function`, Register a callback for a specific event or pass an object with
with event => callback key/value pairs to register listeners for
multiple events.



### signal(type, data, to) 

Send a signal using the OpenTok signaling apiKey

**Parameters**

**type**: `String`, Send a signal using the OpenTok signaling apiKey

**data**: `*`, Send a signal using the OpenTok signaling apiKey

**to**: `Object`, An OpenTok connection object

**Returns**: `Promise`, <resolve: empty, reject: Error>


### startCall() 

Start publishing the local camera feed and subscribing to streams in the session

**Returns**: `Promise`, <resolve: Object, reject: Error>


### state() 

Get the internal state of acc-core, including streams, publishers, subscribers,
a map of stream ids to publisher/subscriber ids, and meta data.

**Returns**: `Object`


### subscribe(stream) 

Subscribe to a stream and update the state

**Parameters**

**stream**: `Object`, An OpenTok stream object

**Returns**: `Promise`, <resolve: empty reject: Error >


### toggleLocalAudio(enable) 

Enable or disable local audio

**Parameters**

**enable**: `Boolean`, Enable or disable local audio



### toggleLocalVideo(enable) 

Enable or disable local video

**Parameters**

**enable**: `Boolean`, Enable or disable local video



### toggleRemoteAudio(id, enable) 

Enable or disable remote audio

**Parameters**

**id**: `String`, Subscriber id

**enable**: `Boolean`, Enable or disable remote audio



### toggleRemoteVideo(id, enable) 

Enable or disable local video

**Parameters**

**id**: `String`, Subscriber id

**enable**: `Boolean`, Enable or disable local video



### unsubscribe(subscriber) 

Unsubscribe from a stream and update the state

**Parameters**

**subscriber**: `Object`, An OpenTok subscriber object

**Returns**: `Promise`, <resolve: empty>



* * *










