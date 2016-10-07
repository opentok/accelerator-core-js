/* eslint-disable */
/* Let CRA handle linting for sample app */
import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';
import logo from './logo.svg';
import otCore from './dist/core.js';
import config from './config.json';
import './App.css';
import 'opentok-solutions-css';

const otCoreOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: config.sessionId,
    token: config.token,
  },
  // A container can either be a query selector or an HTMLElement
  containers: {
    publisher: {
      camera: '#cameraPublisherContainer',
      screen: '#screenPublisherContainer',
    },
    subscriber: {
      camera: '#cameraSubscriberContainer',
      screen: '#screenSubscriberContainer',
    },
    controls: '#controls',
    chat: '#chat'
  },
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
  communication: {
    callProperites: null, // Using default
  },
  textChat: {
    name: ['David', 'Paul', 'Emma', 'George', 'Amanda'][Math.random() * 5 | 0],
    waitingMessage: 'Messages will be delivered when other users arrive',
  },
  screenSharing: {
    extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo',
    annotation: true,
    externalWindow: false,
    dev: true,
    screenProperties: null, // Using default
  },
  annotation: {

  },
  archiving: {
    startURL: 'https://example.com/startArchive',
    stopURL: 'https://example.com/stopArchive',
  }
};

const connectingMask = () =>
  <div className="App-mask">
    <Spinner />
    <div className="message with-spinner">Connecting</div>
  </div>

const startCallMask = start =>
  <div className="App-mask">
    <div className="message button clickable" onClick={start}>Click to Start Call</div>
  </div>



class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      active: false,
      publishers: null,
      subscribers: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
    };
    this.startCall = this.startCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  startCall() {
    this.setState({ active: true });
    otCore.startCall()
      .then(({ publishers, subscribers, meta }) => {
        this.setState({ publishers, subscribers, meta });
      }).catch(error => console.log(error));
  }

  componentDidMount() {
    otCore.init(otCoreOptions);
    otCore.connect().then(() => this.setState({ connected: true }));
    const events = [
      'subscribeToCamera',
      'unsubscribeFromCamera',
      'subscribeToScreen',
      'unsubscribeFromScreen',
      'startScreenShare',
      'endScreenShare',
    ];

    events.forEach(event => otCore.on(event, ({ publishers, subscribers, meta }) => {
      this.setState({ publishers, subscribers, meta });
    }));
  }

  toggleLocalAudio() {
    otCore.toggleLocalAudio(!this.state.localAudioEnabled);
    this.setState({localAudioEnabled: !this.state.localAudioEnabled});
  }

  toggleLocalVideo() {
    otCore.toggleLocalVideo(!this.state.localVideoEnabled);
    this.setState({localVideoEnabled: !this.state.localVideoEnabled});
  }

  render() {
    const { connected, active, subscribers, publishers, meta, localAudioEnabled, localVideoEnabled } = this.state;
    const localAudioClass = classNames('ots-video-control circle audio', {'muted': !localAudioEnabled});
    const localVideoClass = classNames('ots-video-control circle video', {'muted': !localVideoEnabled})
    const sharingScreen = meta ? !!meta.publisher.screen : false;
    const viewingSharedScreen = meta ? meta.subscriber.screen : false;
    const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
    const controlClass = classNames('App-control-container', { 'hidden': !active });
    const cameraPublisherClass = classNames('video-container', { 'small': !!activeCameraSubscribers || sharingScreen }, { 'left': sharingScreen || viewingSharedScreen });
    const screenPublisherClass = classNames('video-container', { 'hidden': !sharingScreen });
    const cameraSubscriberClass = classNames('video-container', { 'hidden': !activeCameraSubscribers },
      `active-${activeCameraSubscribers}`, { 'small': viewingSharedScreen || sharingScreen }
    );
    const screenSubscriberClass = classNames('video-container', { 'hidden': !viewingSharedScreen });

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>OpenTok Accelerator Core</h1>
        </div>
        <div className="App-main">
          <div id="controls" className={controlClass}>
              <div className={localAudioClass} onClick={this.toggleLocalAudio}></div>
              <div className={localVideoClass} onClick={this.toggleLocalVideo}></div>
          </div>
          <div className="App-video-container">
            { !connected && connectingMask() }
            { connected && !active && startCallMask(this.startCall)}
            <div id="cameraPublisherContainer" className={cameraPublisherClass}></div>
            <div id="screenPublisherContainer" className={screenPublisherClass}></div>
            <div id="cameraSubscriberContainer" className={cameraSubscriberClass}></div>
            <div id="screenSubscriberContainer" className={screenSubscriberClass}></div>
          </div>
          <div id="chat" className="App-chat-container"></div>
        </div>
      </div>
    );
  }
}

export default App;
