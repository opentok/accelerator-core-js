const config = {
  apiKey: '47107594',
  sessionId:
    '1_MX40NzEwNzU5NH5-MTYxMjM3OTY3NTcwNH5UbjJhTkd4NWMyaDUyZmdtVkovbFZqaEl-fg',
  token:
    'T1==cGFydG5lcl9pZD00NzEwNzU5NCZzaWc9YjIwZWQxZjRjMTc3MDhmZjVhODFjZmQxYTczZmFiZDFjNjRiZTk4NDpzZXNzaW9uX2lkPTFfTVg0ME56RXdOelU1Tkg1LU1UWXhNak0zT1RZM05UY3dOSDVVYmpKaFRrZDROV015YURVeVptZHRWa292YkZacWFFbC1mZyZjcmVhdGVfdGltZT0xNjEyMzc5Njg1Jm5vbmNlPTAuMjUyMjczODA5MTg4NjIwMSZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNjEyNDAxMjgzJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9',
  extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo'
};

const otCoreOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: config.sessionId,
    token: config.token
  },
  // A container can either be a query selector or an HTML Element
  streamContainers(pubSub, type) {
    return {
      publisher: {
        camera: '#cameraPublisherContainer',
        screen: '#screenPublisherContainer'
      },
      subscriber: {
        camera: '#cameraSubscriberContainer',
        screen: '#screenSubscriberContainer'
      }
    }[pubSub][type];
  },
  controlsContainer: '#controls',
  packages: [],
  communication: {
    callProperites: null // Using default
  },
  textChat: {
    name: ['David', 'Paul', 'Emma', 'George', 'Amanda'][
      (Math.random() * 5) | 0
    ], // eslint-disable-line no-bitwise
    waitingMessage: 'Messages will be delivered when other users arrive',
    container: '#chat'
  }
  // screenSharing: {
  //   extensionID: config.extensionID,
  //   annotation: true,
  //   externalWindow: false,
  //   dev: true,
  //   screenProperties: {
  //     insertMode: 'append',
  //     width: '100%',
  //     height: '100%',
  //     showControls: false,
  //     style: {
  //       buttonDisplayMode: 'off'
  //     },
  //     videoSource: 'window',
  //     fitMode: 'contain' // Using default
  //   }
  // },
  // annotation: {
  //   absoluteParent: {
  //     publisher: '.app-video-container',
  //     subscriber: '.app-video-container'
  //   }
  // }
};
