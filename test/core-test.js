/* Sample Test Suite for Core.js in core-accelerator component */

require('../src/core');
import * as Core from '../src/core';

var expect = chai.expect;

if (!Function.prototype.bind) {
    Function.prototype.bind = function() {
        var fn = this,
            args = Array.prototype.slice.call(arguments),
            context = args.shift();
        return function() {
            fn.apply(context, args);
        };
    };
}

describe('Core Tests', function() {

   before(function() {

   });

   after(function(){

   });

   describe('Test init core', function() {
     var _credentials = {
       apiKey: "any",
       sessionId: "any",
       token: "any"
     };
     var _containers = {};
     var _options = {
       credentials: _credentials,
       packages: ["any"],
       containers: _containers
     };
     it('Should pass', function() {
      expect(true).to.be.true;
     });
       xit('Should init core', function() {
        expect(Core.init.bind(Core.init, _options)).not.to.throw('');
       });

       xit('Should throw exception when init core and there is not options', function() {
        expect(Core.init.bind(Core.init)).to.throw('Missing options required for initialization');
       });

       xit('Should throw exception when init core and credentials are not valid', function() {
         _containers = {};
         _credentials = {
           sessionId: "any",
           token: "any"
         };
         _options = {
           credentials: _credentials,
           packages: ["any"],
           containers: _containers
         };
        expect(Core.init.bind(Core.init, _options)).to.throw('apiKey is a required credential');
        _credentials = {
          apiKey: "any",
          token: "any"
        };
        _options = {
          credentials: _credentials,
          packages: ["any"],
          containers: _containers
        };
       expect(Core.init.bind(Core.init, _options)).to.throw('sessionId is a required credential');
       _credentials = {
         apiKey: "any",
         sessionId: "any",
       };
       _options = {
         credentials: _credentials,
         packages: ["any"],
         containers: _containers
       };
      expect(Core.init.bind(Core.init, _options)).to.throw('token is a required credential');
       });

   });

   describe('Test Connect/Disconnect', function() {
      xit('Should connect', function() {
        expect(Core.connect.bind(Core.connect)).not.to.throw('');
      });
      xit('Should disconnect', function() {
        expect(Core.disconnect.bind(Core.disconnect)).not.to.throw('');
      });
      xit('Should disconnect', function() {
        expect(Core.disconnect.bind(Core.disconnect)).not.to.throw('');
      });
   });

   describe('Test Force Unpublish', function() {
      xit('Should unpublish', function() {
        var _stream = "any";
        expect(Core.forceUnpublish.bind(Core.forceUnpublish, _stream)).not.to.throw('');
       });
   });

   describe('Test Get Publisher for Stream', function() {
      xit('Should get publisher for stream', function() {
        var _stream = "any";
        expect(Core.getPublisherForStream.bind(Core.getPublisherForStream, _stream)).not.to.throw('');
        var _publishers = Core.getPublisherForStream(_stream);
        expect(_publishers).not.to.be.null;
       });
   });

   describe('Test Get Subscriber for Stream', function() {
      xit('Should get subscriber for stream', function() {
        var _stream = "any";
        expect(Core.getSubscribersForStream.bind(Core.getSubscribersForStream, _stream)).not.to.throw('');
        var _subscribers = Core.getSubscribersForStream(_stream);
        expect(_subscribers).not.to.be.null;
       });
   });

   describe('Test Get Accelerator Pack', function() {
      xit('Should get acc-pack', function() {
        expect(Core.getAccPack.bind(Core.getAccPack, "archiving")).not.to.throw('');
        var _accPack = Core.getAccPack("textChat");
        expect(_accPack).not.to.be.null;
       });
   });

   describe('Test Get Options', function() {
      xit('Should get options return null when not init', function() {
        expect(Core.getOptions.bind(Core.getOpions)).not.to.throw('');
        var _options = Core.getOptions();
        expect(_options).to.be.null;
       });
   });

   describe('Test Get Session', function() {
      xit('Should get session return null when not init', function() {
        expect(Core.getSession.bind(Core.getSession)).not.to.throw('');
        var _session = Core.getSession();
        expect(_session).to.be.null;
       });
   });

   describe('Test Signal', function() {
      xit('Should signal', function() {
        expect(Core.signal.bind(Core.signal, "any", "any", "any")).not.to.throw('');
       });
   });

   describe('Test toggle Local Audio/Video', function() {
      xit('Should toggle local audio', function() {
        expect(Core.toggleLocalAudio.bind(Core.toggleLocalAudio, "true")).not.to.throw('');
        expect(Core.toggleLocalAudio.bind(Core.toggleLocalAudio, "false")).not.to.throw('');
       });
       xit('Should toggle local video', function() {
         expect(Core.toggleLocalVideo.bind(Core.toggleLocalVideo, "true")).not.to.throw('');
         expect(Core.toggleLocalVideo.bind(Core.toggleLocalVideo, "false")).not.to.throw('');
        });
   });

  // TO DO
  //  describe('Test toggle Remote Audio/Video', function() {
  //    it('Should toggle remote audio', function() {
  //      expect(Core.toggleRemoteAudio.bind(Core.toggleRemoteAudio, "any", "true")).not.to.throw('');
  //      expect(Core.toggleRemoteAudio.bind(Core.toggleRemoteAudio, "any", "false")).not.to.throw('');
  //     });
  //     it('Should toggle remote video', function() {
  //       expect(Core.toggleRemoteVideo.bind(Core.toggleRemoteVideo, "any", "true")).not.to.throw('');
  //       expect(Core.toggleRemoteVideo.bind(Core.toggleRemoteVideo, "any", "false")).not.to.throw('');
  //      });
  //  });

});
