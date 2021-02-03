const otCore = new AccCore(otCoreOptions);
otCore.connect();

const startCall = () => {
  otCore
    .startCall()
    .then(() => { })
    .catch((error) => console.log(error));
};

const endCall = () => {
  this.otCore.endCall();
  this.active = false;
};

const toggleLocalAudio = () => {
  this.otCore.toggleLocalAudio(!this.localAudioEnabled);
  this.localAudioEnabled = !this.localAudioEnabled;
};

const toggleLocalVideo = () => {
  this.otCore.toggleLocalVideo(!this.localVideoEnabled);
  this.localVideoEnabled = !this.localVideoEnabled;
};
