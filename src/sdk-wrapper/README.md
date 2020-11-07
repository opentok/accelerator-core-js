# OpenTok JS SDK Wrapper

The OpenTok SDK Wrapper provides a wrapper around the [OpenTok.js Client Library](https://tokbox.com/developer/sdks/js/).  The `sdk-wrapper` exposes the same functionality and a (near) identical API as the client library with the added benefit of built-in state management.  Invoking the `state()` method of the `sdk-wrapper` returns an object containing:

```javascript
  streams     => All current streams
  streamMap   => The map of stream ids to publisher/subscriber ids
  publishers  => All current publishers
  subscribers => All current subscribers
  meta        => The count of all current publishers and subscribers by type
```

## Usage

```javascript
const OpenTokSDK = require('opentok-accelerator-core').OpenTokSDK;
// or with ES6 Modules
import { OpenTokSDK } from 'opentok-accelerator-core';

const credentials = {
  apiKey: 'YOUR_OPENTOK_API_KEY',
  sessionID: 'YOUR_OPENTOK_SESSION_ID',
  token: 'YOUR_OPENTOK_SESSION_TOKEN'
};

const otSDK = new OpenTokSDK(credentials);
```

# API

### `connect(eventListeners)`

*Connect to the OpenTok session*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> eventListeners | `Array | Object` | An object (or array of objects) with eventName/callback k/v pairs |

### Returns

> `Promise => <resolve: empty, reject: Error>`

---

## `disconnect()`

*Disconnect from the OpenTok session*

---

## `enablePublisherAudio(enable)`

*Enable or disable local publisher audio*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> enable | `Boolean` | Enable or disable local publisher audio

---

## `enablePublisherVideo(enable)`

*Enable or disable local publisher video*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> enable | `Boolean` | Enable or disable local publisher video

---

## `enableSubscriberAudio(streamId, enable)`

*Enable or disable local subscriber audio*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> streamId | `String` | StreamId of the subscriber to modify
> enable | `Boolean` | Enable or disable local subscriber audio

---

## `enableSubscriberVideo(streamId, enable)`

*Enable or disable local subscriber video*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> streamId | `String` | StreamId of the subscriber to modify
> enable | `Boolean` | Enable or disable local subscriber audio

---

## `forceDisconnect(connection)`

*Force a remote connection to leave the session*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> connection | `Object` | Force a remote connection to leave the session

### Returns

> `Promise => <resolve: empty, reject: Error>`

---

## `forceUnpublish(stream)`

*Force the publisher of a stream to stop publishing the stream*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> stream | `Object` | Force the publisher of a stream to stop publishing the stream

### Returns

> `Promise => <resolve: empty, reject: Error>`

---

## `isMe(connection)`

*Determines if a connection object is my local connection*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> connection | `Object` | An OpenTok connection object

### Returns

> `Boolean`

---

## `off(events, callback)`

*Remove a callback for a specific event. If no parameters are passed, all callbacks for the session will be removed.*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> events | `String` | The name of the events
> callback | `Function` |

---

## `on(events, callback)`

*Register a callback for a specific event, pass an object
with event => callback key/values (or an array of objects)
to register callbacks for multiple events.*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> events | `String` | The name of the events
> callback | `Function` |

---

## `publish(element, properties, eventListeners, preview)`

*Create and publish a stream*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> element | `String | Object` | The target element
> properties | `Object` | The publisher [properties](https://www.tokbox.com/developer/guides/customize-ui/js/)
> eventListeners | `Array | Object` | An object (or array of objects) with eventName/callback k/v pairs
> preview | `Boolean` | Create a publisher without publishing to the session

### Returns

> `Promise => <resolve: Object, reject: Error>`

---

## `publishPreview(publisher)`

*Publish a 'preview' stream to the session*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> publisher | `Object` | An OpenTok publisher object

### Returns

> `Promise => resolve: empty, reject: Error>`

---

## `signal(type, signalData, to)`

*Send a signal using the OpenTok [Signaling API](https://tokbox.com/developer/guides/signaling/js/)*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> type | `String` | Send a signal using the OpenTok signaling > apiKey
> signalData | `*` | Send a signal using the OpenTok signaling > apiKey
> to | `Object` | An OpenTok connection object

### Returns

> `Promise => <resolve: empty, reject: Error>`

---

## `state()`

*Return the state of the OpenTok session*

### Returns 

> `Object` Streams, publishers, subscribers, stream map, and meta data

---

## `subscribe(stream, container, properties, eventListeners)`

*Subscribe to stream*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> stream | `Object` | Subscribe to stream
> container | `String | Object` | The id of the container or a reference to the element
> properties | `Object`  | Subscribe to stream
> eventListeners | `Array | Object` | An object (or array of objects) with eventName/callback k/v pairs

### Returns

>`Promise => <resolve: empty, reject: Error>`

---

## `unpublish(publisher)`

*Stop publishing a stream*

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> publisher | `Object` | An OpenTok publisher object

---

## `unsubscribe(subscriber)`

Unsubscribe from a stream and update the state

### Parameters

> Name | Type | Description |
> --- | --- | --- |
> subscriber | `Object` | An OpenTok subscriber object

### Returns

>`Promise => <resolve: empty>`

