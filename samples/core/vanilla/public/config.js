const config = {
  apiKey: '47131094',
  sessionId:
    '1_MX40NzEzMTA5NH5-MTYxMzU4OTc5OTYyMn51ZXhsZ3ZjUkRJcG5EQTlUblpBOFZpNGN-fg',
  token:
    'T1==cGFydG5lcl9pZD00NzEzMTA5NCZzaWc9OWE5YjQxZTBiYjQ4N2EyNmUzOTdlZTU0MTNkNTVhM2ZkOTgwMTIzZDpzZXNzaW9uX2lkPTFfTVg0ME56RXpNVEE1Tkg1LU1UWXhNelU0T1RjNU9UWXlNbjUxWlhoc1ozWmpVa1JKY0c1RVFUbFVibHBCT0ZacE5HTi1mZyZjcmVhdGVfdGltZT0xNjEzNTg5ODE4Jm5vbmNlPTAuNjMyNjMzNDQxMDgyMjA2MyZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNjEzNjExNDE2JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9',
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
