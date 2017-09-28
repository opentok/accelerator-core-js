/* Sample Test Suite for Communications.js in core-accelerator component */

require('../src/communication');
import * as Communication from '../src/communication';

var expect = chai.expect;

var _optionsap;
var _accPack;
var _connection;
var _session;
var _annotation;
var _options;

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

describe('Core Communication Tests', function() {

   before(function() {

   });

   after(function(){

   });

   describe('Test init communications', function() {

       xit('Should init communications', function() {
         _options = {
           session: _session,
           publishers: "any",
           subscribers: "any",
           streams: "any",
           connectionLimit: "any",
           streamContainer: "any"
         };
        expect(Communication.init.bind(Communication.init, _options)).not.to.throw('');
       });

   });

   describe('Test Start Call', function() {
      xit('Should start call', function() {
        expect(Communication.startCall.bind(Communication.startCall)).not.to.throw('');
       });
       xit('Should start call even if the call is started', function() {
         Communication.startCall();
         expect(Communication.startCall.bind(Communication.startCall)).not.to.throw('');
        });
   });

   describe('Test End Call', function() {
      xit('Should throw error when end a not started call ', function() {
        expect(Communication.endCall.bind(Communication.endCall)).to.throw('Cannot read property \'logEvent\' of null');
       });
   });

  // TO DO
  //  describe('Test Enable Local Audio-Video', function() {
  //     it('Should enable local audio', function() {
  //       var opt = {
  //         id: "dummy-id",
  //         source: "audio",
  //         enable: true
  //       };
  //       expect(Communication.enableLocalAV.bind(Communication.enableLocalAV, opt))not.to.throw('');
  //      });
  //      it('Should enable local video', function() {
  //        var opt = {
  //          id: "dummy-id",
  //          source: "video",
  //          enable: true
  //        };
  //        expect(Communication.enableLocalAV.bind(Communication.enableLocalAV, opt))not.to.throw('');
  //       });
  //  });

});
