# OpenTok Accelerator Core API Methods

### `@constructor`

**Parameters**

**options**: `Object`

 - **options.credentials**: `Object` (required)

 - **options.name**: `String` A name for your core instance

 - **options.packages**: `Array`

 - **options.streamContainers**: `Function`

 - **options.controlsContainer**: `String`

* * *

### `connect()`

*Connect to the session*

**Returns**: `Promise => <resolve: Object, reject: Error>`


### `disconnect()`

*Disconnect from the session*

**Returns**: `Promise => <resolve: empty, reject: Error>`


### `endCall()`

*Stop publishing and unsubscribe from all streams*



### `forceDisconnect(connection)`

*Force a remote connection to leave the session*

**Parameters**

**connection**: `Object` An OpenTok connection object

**Returns**: `Promise => <resolve: empty, reject: Error>`


### `forceUnpublish(stream)`

*Force the publisher of a stream to stop publishing the stream*

**Parameters**

**stream**: `Object` An OpenTok stream object

**Returns**: `Promise => <resolve: empty, reject: Error>`


### `getAccPack(packageName)`

*Get access to an accelerator pack*

**Parameters**

**packageName**: `String` 'textChat', 'screenSharing', 'annotation', or 'archiving'

**Returns**: `Object` The instance of the accelerator pack


### `getCredentials()`

*Returns the current OpenTok session credentials*

**Returns**: `Object`


### `getOptions()`

*Returns the options used for initialization*

**Returns**: `Object`


### `getPublisherForStream(stream)`

*Get the local publisher object for a stream*

**Parameters**

**stream**: `Object` An OpenTok stream object

**Returns**: `Object` The publisher object


### `getSession()`

*Get the current OpenTok session object*

**Returns**: `Object`


### `getSubscribersForStream(stream)`

*Get the local subscriber objects for a stream*

**Parameters**

**stream**: `Object` An OpenTok stream object

**Returns**: `Array` An array of subscriber object


### `off(event, callback)`

*Remove a callback for a specific event.  If no parameters are passed, all event listeners will be removed.*

**Parameters**

**event**: `String`  The name of the event

**callback**: `Function`



### `on(event, callback)`

*Register a callback for a specific event or pass an object with event => callback key/value pairs to register listeners for multiple events.*

**Parameters**

**event**: `String | Object` The name of the event

**callback**: `function`


### `signal(type, data, to)`

*Send a signal using the OpenTok Signaling API*

**Parameters**

**type**: `String`

**data**: `*`

**to**: `Object`

**Returns**: `Promise => <resolve: empty, reject: Error>`


### `startCall(publisherProps)`

*Start publishing the local camera feed and subscribing to streams in the session*

**Parameters**

**publisherProps**: `Object` - https://goo.gl/0mL0Eo

**Returns**: `Promise => <resolve: Object, reject: Error>`


### `state()`

*Get the internal state of acc-core, including streams, publishers, subscribers, a map of stream ids to publisher/subscriber ids, and meta data.*

**Returns**: `Object`


### `subscribe(stream, subscriberProperties = {}, networkTest = false)`

*Subscribe to a stream and update the state*

**Parameters**

**stream**: `Object` An OpenTok stream object

**stream**: `Object` Optional subscriber properties - https://goo.gl/bzjoLL

**stream**: `Boolean` Optional boolean indicating that we are subscribing to our own publisher as part of a network test

**Returns**: `Promise => <resolve: Subscriber, reject: Error >`


### `toggleLocalAudio(enable)`

*Enable or disable local audio*

**Parameters**

**enable**: `Boolean` Enable or disable local audio



### `toggleLocalVideo(enable)`

*Enable or disable local video*

**Parameters**

**enable**: `Boolean` Enable or disable local video



### `toggleRemoteAudio(id, enable)`

*Enable or disable remote audio*

**Parameters**

**id**: `String`  The subscriber id

**enable**: `Boolean` Enable or disable remote audio



### `toggleRemoteVideo(id, enable)`

*Enable or disable local video*

**Parameters**

**id**: `String`, The subscriber id

**enable**: `Boolean` Enable or disable remote video



### `unsubscribe(subscriber)`

*Unsubscribe from a stream and update the state*

**Parameters**

**subscriber**: `Object` An OpenTok subscriber object

**Returns**: `Promise => <resolve: empty>`

* * *
