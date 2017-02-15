


----------


![logo](https://raw.githubusercontent.com/opentok/accelerator-core/master/tokbox-logo.png)

# OpenTok Accelerator Core
[![Build Status](https://travis-ci.org/opentok/accelerator-core-js.svg?branch=master)](https://travis-ci.org/opentok/accelerator-core-js)


```javascript
otCore.init(options) =>
  Multi-Party Audio/Video +
  Text Chat +
  Screen Sharing +
  Annotation +
  Archiving
```

OpenTok Accelerator Core provides a simple way to integrate real-time audio/video into your web application using the OpenTok Platform.  `Core` provides real-time, multi-party audio/video out of the box, and also integrates with, manages, and provides a single API for the following accelerator packs:

 - [Text Chat](https://www.npmjs.com/package/opentok-text-chat)
 - [Screen Sharing](https://www.npmjs.com/package/opentok-screen-sharing)
 - [Annotation](https://www.npmjs.com/package/opentok-annotation)
 - [Archiving](https://www.npmjs.com/package/opentok-archiving)

`Core` also internally maintains the state of your OpenTok session for you.  Calling `otCore.state()` returns an object containing:
```javascript
  streams     => All current streams
  streamMap   => The map of stream ids to publisher/subscriber ids
  publishers  => All current publishers
  subscribers => All current subscribers
  meta        => The count of all current publishers and subscribers by type
```
*See an example of the publisher, subscriber, and meta data [below](#pubSubData).*

Sample Applications
-------------------
There are two sample applications for `Core` .  The [React](https://github.com/opentok/accelerator-core-js/tree/master/react-sample-app) sample application was built with [Create React App](https://github.com/facebookincubator/create-react-app) and uses [webpack](https://webpack.github.io/) to transpile code.  The other [sample application](https://github.com/opentok/accelerator-core-js/tree/master/vanilla-js-sample-app) is built with vanilla JavaScript.

Installation
------------

```bash
$ npm i --save opentok-accelerator-core
```
webpack/Browserify:
```javascript
const otCore = require('opentok-accelerator-core');
```
Browser:
```javascript
<script src="path/to/browser/opentok-accelerator-core.js"></script>
```

Configuration
-------
`Core` can be configured in a number of ways, but the only required options property is `credentials`, which includes an OpenTok API Key, Session ID, and Token.  These can be obtained from the [developer dashboard](https://tokbox.com/account/#/) or generated with one of the [OpenTok Server SDKs](https://tokbox.com/developer/).

```javascript
const options = {
  credentials: {
    apiKey: yourOpenTokApiKey,
    sessionId: yourOpenTokSessionId,
    token: yourOpenTokToken,
  },

```
The `packages` property specifies which accelerator packs should be included in the application.  If using a bundler like [`webpack`](https://webpack.github.io/) or [`Browserify`](http://browserify.org/), you'll need to install the additional packages using `npm`.  Otherwise `Core` will look for them in global scope.

```javascript
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
```
The `streamContainers` property is a function that specifies which DOM element should be used as a container for a video stream.  The `controlsContainer` property specifies the element to be used as the container for the local audio/video and accelerator pack controls.  These elements can either be [query selectors](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) or references to DOM elements.  The default containers are specified below.  If these containers do not exist in the DOM, `Core` will be append new elements to the `body`.  If `null` is passed as the `controlsContainer` property, no controls will be added to the DOM.

```javascript
  /**
   * @param {String} pubSub - 'publisher' or 'subscriber'
   * @param {String} type - 'camera' or 'screen'
   * @param {*} data - Parsed connection data associated with the stream
   * @param {String} streamId - The stream id (subscriber only)
   */
  streamContainers(pubSub, type, data, streamId){
    return {
      publisher: {
        camera: '#cameraPublisherContainer',
        screen: '#screenPublisherContainer',
      },
      subscriber: {
        camera: '#cameraSubscriberContainer',
        screen: '#screenSubscriberContainer',
      },
    }[pubSub][type];
  },
  controlsContainer: '#videoControls',
```
The communication properties relate to the multi-party communication provided by `Core`.  `autoSubscribe` dictates whether or not `Core` automatically subscribes to new streams and is set to `true` by default.  `connectionLimit` limits the number of parties that may publish/subscribe to the session.  `callProperties` allows for [customization](https://www.tokbox.com/developer/guides/customize-ui/js/) of the UI.

```javascript
  communication: {
    autoSubscribe: true,
    connectionLimit: null,
    callProperties: myCallProperties,
  },
```
*See more on manually subscribing to streams [below](#autoSubscribe).*

The remainder of the options properties are specific to individual accelerator packs.
```javascript
  textChat: {
    name: `David`,
    waitingMessage: 'Messages will be delivered when other users arrive',
    container: '#chat',
  },
  screenSharing: {
    extensionID: 'yourChromeExtensionId',
    extensionPathFF: 'yourFireFoxExtensionURL',
    annotation: true, // 'true' required if sharing current browser window
    externalWindow: false,
    dev: true, // Allow http in development(localhost)
    screenProperties: null,
  },
  annotation: {
    items: myToolbarItems,
    colors: myColorPalette,
    onScreenCapture: myScreenCaptureCallback,
    absoluteParent: {
      publisher: '#videoWrapper',
      subscriber: '#videoWrapper',
    }
  },
  archiving: {
    startURL: 'https://yourapi.com/startArchive',
    stopURL: 'https://yourapi.com/stopArchive',
  }
};

```

Usage
--------------
Initialize `Core`:
```javascript
otCore.init(options);
```
Connect to the session:
```javascript
otCore.connect().then(() => this.setState({ connected: true }));
```
The other `Core` API methods include:
```javascript
getAccPack              => Get a reference to an individual accelerator pack
startCall               => Publish audio/video and subscribe to streams
endCall                 => Stop publishing and unsubscribe from all streams
getSession              => Get the OpenTok Session Object
forceDisconnect         => Force a remote connection to leave the session
forceUnpublish          => Force the publisher a stream to stop publishing
getPublisherForStream   => Get the local publisher object for a stream
getSubscribersForStream => Get the local subscriber objects for a stream
toggleLocalAudio        => Toggle publishing local audio
toggleLocalVideo        => Toggle publishing local video
toggleRemoteAudio       => Toggle subscribing to remote audio
toggleRemoteVideo       => Toggle subscribing to remote video
signal                  => Send a signal using the OpenTok signaling API [1]
state                   => Get the OpenTok session state
subscribe               => Manually subscribe to a stream
```
[1] [OpenTok Signaling API](https://www.tokbox.com/developer/guides/signaling/js/)


Full documentation for the `Core` API can be found [here](https://github.com/opentok/accelerator-core-js/blob/master/API.md).

----------

`Core` exposes a number of events, including all OpenTok [session events](https://www.tokbox.com/developer/sdks/js/reference/Session.html#events), which can be accessed using the `on` method:
```javascript
otCore.on('streamCreated', callback);
```

The data passed to the callback for the following events . . .
```javascript
const events = [
    'subscribeToCamera',
    'unsubscribeFromCamera',
    'subscribeToScreen',
    'unsubscribeFromScreen',
    'startScreenShare',
    'endScreenShare',
    'subscribeToSip',
];
```
will always include the current `publishers`, `subscribers`, and a `meta` object which provides a count of the current `publishers` and `subscribers`, making it easy to keep your UI in sync.  If subscribing to a new stream, the `subscriber` object will be included as well.
<a name="pubSubData"></a>
```javascript
  meta: {
    publisher: {
      camera: 1,
      screen: 0,
      total: 1,
    },
    subscriber: {
      camera: 2,
      screen: 1,
      sip: 0,
      total: 3,
    },
  },
  publishers: {
    camera: {
      'OT_d18d5027-21eb-093f-8c18-e3959f3e7585': OTPublisherObject,
    },
    screen: {}
  },
  subscribers: {
    camera: {
      'OT_d18nd82s-21eb-4b3f-82n8-e3nd723e7585': OTSubscriberObject,
      'OT_d38n82s-9n2b-4sdf-82n8-eadnfdf92nf90': OTSubscriberObject,
    },
    screen: {
      'OT_nd872bd9s-0d82-n431-809l-k1kdjd72mdks': OTSubscriberObject,
    },
  }
```

The full list of events can be seen [here](https://github.com/opentok/accelerator-core-js/blob/master/src/events.js).

----------
<a name="autoSubscribe"></a>
*There may be situations where you need to manually subscribe to streams.  For example,  you need to call `setState` in your React component, wait for the update to finish and your component to re-render so that the container for the new stream is available before subscribing.  In this case, you can set `autoSubscribe` to `false`, listen for new streams, update your state, and subscribe once the update is complete:*

```javascript
otCore.on('streamCreated', ({ stream }) => {
  this.setState({ streams: streams.concat(stream) }, () => {
    otCore.subscribe(stream);
  });
});
```

UI Styling
-------
Default icons and styling for accelerator pack components are provided by `opentok-solutions-css`, which is available as an [npm](https://www.npmjs.com/package/opentok-solutions-css) module or from our [CDN](https://assets.tokbox.com/solutions/css/style.css).  To customize the layout and styling in your application, simply override these CSS rules with your own.


SDK-Wrapper
-------
`Core` will cover the use cases for most projects. If you have a special use case, your first course of action should be to open a Github issue. If there is a way that we can add functionality or increase the flexibility of `core`, or one of the accelerator packs, while maintaining backwards compatibility, we’re happy to do so. Another option is to use the [OpenTok JS SDK Wrapper](https://github.com/opentok/accelerator-core-js/blob/master/sdkWrapper.MD). The `SDK Wrapper` extends the functionality of the [OpenTok JS Client library](https://tokbox.com/developer/sdks/js/)  with the same state management provided by `Accelerator Core`. Some use cases for the SDK Wrapper may be:

- Creating a messaging or signaling layer using OpenTok sessions.
- Running multiple sessions simultaneously in the same application instance.
- Managing presence without any audio/video, using OpenTok sessions.

You can also use Accelerator Core and the SDK Wrapper in conjunction with each other. While Core is a singleton, the SDK Wrapper provides a constructor, meaning that multiple instances may be created and used at the same time.
