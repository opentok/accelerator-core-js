/* Sample Test Suite for State.js in core-accelerator component */

require('../src/state');
import * as State from '../src/state';

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

describe('Core State Tests', function() {

   before(function() {

   });

   after(function(){

   });

  //  describe('Test Publisher and Subscribers count', function() {
  //     it('Should count publishers and subscribers', function() {
  //       expect(State.pubSubCount.bind(State.pubSubCount)).not.to.throw('');
  //       var _count = State.pubSubCount();
  //       expect(_count).not.to.be.null;
  //      });
  //  });

   describe('Test Get Publisher and Subscribers', function() {
      xit('Should get publishers and subscribers', function() {
        expect(State.getPubSub.bind(State.getPubSub)).not.to.throw('');
        var _pubSubsCount = State.getPubSub();
        expect(_pubSubsCount).not.to.be.null;
       });
   });

   describe('Test get Streams, Publishers and Subscribers', function() {
     xit('Should get streams, publishers and subscribers', function() {
        expect(State.all.bind(State.all)).not.to.throw('');
        var _all = State.all();
        expect(_all).not.to.be.null;
       });
   });

   describe('Test add/remove Stream', function() {
     var _stream = {
       id: "any",
       videoType: "any"
     };
     xit('Should add stream', function() {
        expect(State.addStream.bind(State.addStream, _stream)).not.to.throw('');
        var _streams = State.getStreams();
        expect(_streams[_stream.id]).not.to.be.null;
       });
      //  it('Should remove stream', function() {
      //     State.addStream(_stream);
      //     var _streams = State.getStreams();
      //     expect(_streams[_stream.id]).not.to.be.null;
      //     expect(State.removeStream.bind(State.removeStream, _stream)).not.to.throw('');
      //     _streams = State.getStreams();
      //     expect(_streams[_stream.id]).to.be.null;
      //    });
   });

  //  describe('Test add/remove Publisher', function() {
  //    var _pub = {
  //      streamId: "any",
  //      id: "any"
  //    };
  //    it('Should add publisher', function() {
  //       expect(State.addPublisher.bind(State.addPublisher, "any", _pub)).not.to.throw('');
  //      });
  //     it('Should add publisher', function() {
  //       State.addPublisher("any", _pub);
  //       expect(State.removePublisher.bind(State.removePublisher, "any", _pub)).not.to.throw('');
  //     });
  //  });


});
