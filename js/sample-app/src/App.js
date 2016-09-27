/* eslint-disable */
/* Let CRA handle linting for sample app */
import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';
import logo from './logo.svg';
import otAcc from './acc/api';
import config from './config.json';
import './App.css';
import 'opentok-solutions-css';

const otAccOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: config.sessionId,
    token: config.token,
  },
  // A container can either be a query selector or an HTMLElement
  containers: {
    publisher: {
      camera: '#publisherContainer',
      screen: '#publisherContainer',
    },
    subscriber: {
      camera: '#subscriberContainer',
      screen: '#subscriberContainer',
    },
    controls: '#controls',
  },
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
  communication: {

  },
  textChat: {
    alias: 'Aaron'
  },
  screenSharing: {
    extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo'
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

const startCallMask = startCall =>
  <div className="App-mask">
    <div className="message button clickable" onClick={startCall}>Click to Start Call</div>
  </div>

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { connected: false, active: false, cameraSubscribers: 0, screenSubscribers: 0};
    this.startCall = this.startCall.bind(this);
  }

  startCall() {
    const subscribers = otAcc.startCall();
    this.setState({ active: true, subscribers })
  }

  componentDidMount() {
    otAcc.init(otAccOptions);
    otAcc.connect().then((remoteParticpant) => this.setState({ connected: true, remoteParticpant }));
    otAcc.on('subscribeToCamera', () => {
      const updatedCount = this.state.cameraSubscribers + 1;
      console.log('ccccc', updatedCount)
      this.setState({cameraSubscribers: updatedCount})});
  }

  render() {
    const { connected, active, cameraSubscribers } = this.state;
    console.log('aslkdjfhlasf', cameraSubscribers);
    const publisherClass = classNames(
      'video-container',
      {small: !!cameraSubscribers}
    );

    const subscriberClass = classNames(
      'video-container',
      {hidden: !cameraSubscribers}
    );

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>OpenTok Accelerator Core</h1>
        </div>
        <div className="App-main">
          <div className="App-video-container">
            { !connected && connectingMask() }
            { connected && !active && startCallMask(this.startCall)}
            <div id="publisherContainer" className={publisherClass}></div>
            <div id="subscriberContainer" className={subscriberClass}></div>
            <div id="controls"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
