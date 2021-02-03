<template>
  <div class="app">
    <header>
      <img src="./assets/logo.png" class="logo" alt="Vonage" />
      <h1>Video API Accelerator Core</h1>
    </header>
    <article>
      <main class="app-video-container">
        <div v-if="!connected" className="app-mask">
          <!-- <Spinner /> -->
          <div className="message with-spinner">Connecting</div>
        </div>
        <div v-if="connected && !active" className="app-mask">
          <button
            className="message button clickable"
            @click.prevent="startCall"
          >
            Click to Start Call
          </button>
        </div>
        <div id="cameraPublisherContainer" class="{cameraPublisherClass}" />
        <div id="screenPublisherContainer" class="{screenPublisherClass}" />
        <div id="cameraSubscriberContainer" class="{cameraSubscriberClass}" />
        <div id="screenSubscriberContainer" class="{screenSubscriberClass}" />
      </main>
      <section v-if="active" id="controls">
        <div
          class="audio"
          v-bind:class="{ muted: !localAudioEnabled }"
          @click.prevent="toggleLocalAudio"
        />
        <div
          class="video"
          v-bind:class="{ muted: !localVideoEnabled }"
          @click.prevent="toggleLocalVideo"
        />
        <div class="end-call" @click.prevent="endCall" />
      </section>
      <aside id="chat" />
    </article>
  </div>
</template>

<script>
import config from './config.json';

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

export default {
  name: 'app',
  data() {
    return {
      active: false,
      connected: false,
      localAudioEnabled: true,
      localVideoEnabled: true,
      otCore: null
    };
  },
  mounted() {
    this.otCore = new AccCore(otCoreOptions);
    this.otCore.connect().then(() => {
      this.connected = true;
    });
  },
  methods: {
    startCall() {
      this.otCore
        .startCall()
        .then(() => {
          this.active = true;
        })
        .catch((error) => console.log(error));
    },
    endCall() {
      this.otCore.endCall();
      this.active = false;
    },
    toggleLocalAudio() {
      this.otCore.toggleLocalAudio(!this.localAudioEnabled);
      this.localAudioEnabled = !this.localAudioEnabled;
    },
    toggleLocalVideo() {
      this.otCore.toggleLocalVideo(!this.localVideoEnabled);
      this.localVideoEnabled = !this.localVideoEnabled;
    }
    // subscribeToStream({ stream }) {
    //   const type = stream.videoType;
    //   this.otCore.subscribe(stream);
    // }
  }
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: sans-serif;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}

header {
  background-color: #000;
  height: 40px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

header h1 {
  font-size: 16px;
  font-weight: 200;
}

header .logo {
  height: 60%;
  width: auto;
}

article {
  position: relative;
  width: 75vw;
  height: calc(75vw * 0.6);
  margin: 10px auto;
  border: 1px solid lightblue;
}

#controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

#controls div {
  width: 50px;
  height: 50px;
  margin: 20px 0 !important;
  border: 2px solid white;
  border-radius: 50%;
  background-position: center;
  background-color: rgba(27, 134, 144, 0.4);
  background-color: lightgrey;
  background-repeat: no-repeat;
  cursor: pointer;
}

#controls div.audio {
  background-image: url(https://assets.tokbox.com/solutions/images/icon-mic.png);
}

#controls div.audio:hover,
#controls div.audio.muted {
  background-image: url(https://assets.tokbox.com/solutions/images/icon-muted-mic.png);
}

#controls div.video {
  background-image: url(https://assets.tokbox.com/solutions/images/icon-video.png);
}

#controls div.video.muted {
  background-image: url(https://assets.tokbox.com/solutions/images/icon-no-video.png);
}

#controls div.end-call {
  background-image: url(https://assets.tokbox.com/solutions/images/icon-hang-up.png);
  background-color: red;
}

main {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

main .video-container {
  width: 100%;
  height: 100%;
  display: flex;
}

main .video-container.small {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 160px;
  height: 96px;
  border: 1px solid #fcba00;
  z-index: 2;
}

main .video-container.small.left {
  left: 20px;
  border: 1px solid #00fcc2;
}

main .video-container.hidden {
  display: none;
}

main .video-container.active-gt2 {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 100%;
  width: 100%;
}

main .video-container.active-gt2.hidden {
  display: none;
}

main .video-container.active-gt2 .OT_subscriber {
  margin: 0;
  padding: 0;
  display: inline-block;
  font-size: 0;
  flex-basis: 50%;
  box-sizing: border-box;
  width: auto !important;
  height: auto !important;
}

main .video-container.active-gt2.active-odd .OT_subscriber:first-child {
  flex-basis: 100%;
}

.app-mask {
  width: 100%;
  height: 100%;
  position: relative;
  color: white;
  background: rgba(27, 134, 144, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-mask .react-spinner {
  position: absolute;
}

.app-mask .message {
  font-weight: 200;
}

.app-mask .message.with-spinner {
  position: absolute;
  top: 55%;
}

.app-mask .message.button {
  border: 1px solid white;
  padding: 20px 40px;
  border-radius: 6px;
  background-color: Transparent;
  color: white;
  font-family: sans-serif;
  font-size: medium;
}

.app-mask .message.button:focus:active,
.message.button:focus,
.message.button:active {
  background-image: none;
  outline: none;
  -webkit-box-shadow: none;
  box-shadow: none;
}
</style>
