let screenSharing;
let textChat;
let annotation;
let archiving;

const exampleOptions = {
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
  communication: {

  },
  textChat: {

  },
  screenSharing: {

  },
  annotation: {

  },
};

const initAcceleratorPacks = (requestedPackages) => {
  const env = typeof module === 'object' && typeof module.exports === 'object' ?
    'node' :
    'browser';

  const availablePackages = {
    textChat: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-text-chat'),
      browser: () => TextChatAccPack, // eslint-disable-line no-undef
    },
    screenSharing: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-screen-sharing'),
      browser: () => ScreenSharingAccPack, // eslint-disable-line no-undef
    },
    annotation: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-annotation'),
      browser: () => AnnotationAccPack, // eslint-disable-line no-undef
    },
    archiving: { // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      node: () => require('opentok-archiving'),
      browser: () => ArchivingAccPack, // eslint-disable-line no-undef
    },
  };
  requestedPackages.forEach((acceleratorPack) => {
    if (availablePackages[acceleratorPack]) { // eslint-disable-next-line no-param-reassign
      acceleratorPack = availablePackages[acceleratorPack][env]();
    } else {
      console.log(`OpenTok: ${acceleratorPack} is not a valid accelerator pack`);
    }
  });
};

const init = (options) => {
  initAcceleratorPacks(options.packages);
};

module.exports = {
  init,
};
