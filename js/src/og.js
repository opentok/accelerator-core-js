/* global define */
/* eslint-disable vars-on-top */

var ScreenSharingAccPack;
var AnnotationAccPack;
var TextChatAccPack;
var ArchivingAccPack;
var _;
var api = require('../services/api');
var H = require('hanuman-js');

if (typeof module === 'object' && typeof module.exports === 'object') {
  _ = require('underscore');
} else {
  _ = this._;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  ScreenSharingAccPack = require('opentok-screen-sharing');
} else {
  ScreenSharingAccPack = ScreenSharingAccPack;
}


if (typeof module === 'object' && typeof module.exports === 'object') {
  TextChatAccPack = require('opentok-text-chat');
} else {
  TextChatAccPack = TextChatAccPack;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  AnnotationAccPack = require('opentok-annotation');
} else {
  AnnotationAccPack = AnnotationAccPack;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  ArchivingAccPack = require('opentok-archiving');
} else {
  ArchivingAccPack = ArchivingAccPack;
}


(function () {

  var _this;
  var _session;
  var _textChat; // eslint-disable-line no-unused-vars
  var _annotation;
  var _screensharing; // eslint-disable-line no-unused-vars
  var _archiving; // eslint-disable-line no-unused-vars
  var _streams = [];

  var _commonOptions = {
    subscribers: [],
    streams: [],
    localCallProperties: {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      showControls: false,
      style: {
        buttonDisplayMode: 'off'
      }
    },
    localScreenProperties: {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      videoSource: 'window',
      showControls: false,
      style: {
        buttonDisplayMode: 'off'
      }
    }
  };

  /**
   * Private methods
   */

  /** Eventing */
  var _events = {}; // {eventName: [callbacks functions . . .]}
  var _isRegisteredEvent = _.partial(_.has, _events);

  /**
   * Register events that can be listened to be other components/modules
   * @param {array | string} events - A list of event names. A single event may
   * also be passed as a string.
   * @returns {function} See triggerEvent
   */
  var registerEvents = function (events) {

    var eventList = Array.isArray(events) ? events : [events];

    _.each(eventList, function (event) {
      if (!_isRegisteredEvent(event)) {
        _events[event] = [];
      }
    });

  };

  /**
   * Register an event listener with the AP layer
   * @param {string} event - The name of the event
   * @param {function} callback - The function invoked upon the event
   */
  var registerEventListener = function (event, callback) {

    if (typeof callback !== 'function') {
      throw new Error('Provided callback is not a function');
    }

    if (!_isRegisteredEvent(event)) {
      registerEvents(event);
    }

    _events[event].push(callback);
  };

  /**
   * Stop a callback from being fired when an event is triggered
   * @param {string} event - The name of the event
   * @param {function} callback - The function invoked upon the event
   */
  var removeEventListener = function (event, callback) {

    if (typeof callback !== 'function') {
      throw new Error('Provided callback is not a function');
    }

    var listeners = _events[event];

    if (!listeners || !listeners.length) {
      return;
    }

    var index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

  };

  /**
   * Fire all registered callbacks for a given event
   * @param {string} event - The event name
   * @param {*} data - Data to be passed to the callback functions
   */
  var triggerEvent = function (event, data) {
    if (_.has(_events, event)) {
      _.each(_events[event], function (fn) {
        fn(data);
      });
    }
  };

  /**
   * @param [string] type - A subset of common options
   */
  var getOptions = function (type) {

    return type ? _commonOptions[type] : _commonOptions;

  };

  var _validateOptions = function (options) {

    var requiredProps = ['sessionId', 'apiKey', 'token'];

    _.each(requiredProps, function (prop) {
      if (!_.property(prop)(options)) {
        throw new Error('Accelerator Pack requires a session ID, apiKey, and token');
      }
    });

    return options;
  };

  /**
   * Returns the current session
   */
  var getSession = function () {
    return _session;
  };

  /**
   * Initialize the annotation component for use in external window
   * @returns {Promise} < Resolve: [Object] External annotation window >
   */
  var setupExternalAnnotation = function () {
    return _annotation.start(_session, {
      screensharing: true
    });

  };

  /**
   * Initialize the annotation component for use in external window
   * @returns {Promise} < Resolve: [Object] External annotation window >
   */
  var endExternalAnnotation = function () {
    return _annotation.end();
  };

  /**
   * Initialize the annotation component for use in current window
   * @returns {Promise} < Resolve: [Object] External annotation window >
   */
  var setupAnnotationView = function (subscriber) {
    var canvasContainer = document.getElementById('videoHolderSharedScreen');
    var videoContainer = document.getElementById('videoContainer');
    var annotationOptions = {
      canvasContainer: canvasContainer
    };
    _annotation.start(_session, annotationOptions)
      .then(function () {
        var mainContainer = document.querySelector(_this.options.screensharing.primaryContainer);
        _annotation.linkCanvas(subscriber, canvasContainer, {
          absoluteParent: videoContainer
        });
        _annotation.resizeCanvas();
      });
  };

  /**
   * Initialize the annotation component for use in current window
   * @returns {Promise} < Resolve: [Object] External annotation window >
   */
  var endAnnotationView = function () {
    _annotation.end();
  };

  /**
   * Connect the annotation canvas to the publisher or subscriber
   * @param {Object} pubSub - The publisher or subscriber
   * @param {Object} annotationContainer
   * @param [Object] externalWindow
   *
   */
  var linkAnnotation = function (pubSub, annotationContainer, externalWindow) {

    _annotation.linkCanvas(pubSub, annotationContainer, {
      externalWindow: externalWindow
    });

    if (externalWindow) {
      var subscriberStream = _.findWhere(_streams, { videoType: 'camera' });
      if (!!subscriberStream) {
        _annotation.addSubscriberToExternalWindow(Object.assign({}, subscriberStream));
      }
    }

  };

  var _registerSessionEvents = function () {

    registerEvents(['streamCreated', 'streamDestroyed', 'sessionError']);

    _session.on({
      streamCreated: function (event) {
        _streams.push(event.stream);
        triggerEvent('streamCreated', event);
      },
      streamDestroyed: function (event) {
        var destroyedIndex = _streams.indexOf(event.stream);
        if (destroyedIndex !== -1) {
          _streams.splice(destroyedIndex, 1);
        }
        triggerEvent('streamDestroyed', event);
      }
    });
  };


  var _setupEventListeners = function () {
    if (!!_annotation) {
      registerEventListener('startViewingSharedScreen', setupAnnotationView);
      registerEventListener('endViewingSharedScreen', endAnnotationView);
      registerEventListener('endScreenSharing', endExternalAnnotation);
    }
  };

  /**
   * Initialize text-chat
   */
  var _initTextChatComponent = _.once(function () {

    if (!!TextChatAccPack && _this.options.textChat) {

      // Generates a random alpha-numeric string of n length
      var uniqueString = function (length) {
        var len = length || 3;
        return Math.random().toString(36).substr(2, len);
      };

      // Returns session id prepended and appended with unique strings
      var generateUserId = function () {
        return [uniqueString(), _session.id, uniqueString()].join('');
      };

      var textChatOptions = {
        accPack: _this,
        session: _session,
        sender: _.defaults(_this.options.textChat.sender, {
          id: generateUserId(),
          alias: ['User', uniqueString()].join(' ')
        }),
        limitCharacterMessage: _this.options.textChat.limitCharacterMessage,
        controlsContainer: _this.options.textChat.controlsContainer,
        textChatContainer: _this.options.textChat.textChatContainer,
        alwaysOpen: _this.options.textChat.alwaysOpen
      };

      _textChat = new TextChatAccPack(textChatOptions);
    }

  });

  /**
   * Initialize any of the accelerator pack components included in the application.
   */
  var _initAccPackComponents = _.once(function () {

    if (!!ScreenSharingAccPack && _this.options.screensharing) {

      var screensharingProps = [
        'sessionId',
        'annotation',
        'extensionURL',
        'extensionID',
        'extensionPathFF',
        'screensharingContainer'
      ];

      var screensharingOptions = _.extend(_.pick(_this.options, screensharingProps),
        _this.options.screensharing, {
          session: _session,
          accPack: _this,
          localScreenProperties: _commonOptions.localScreenProperties
        });

      _screensharing = new ScreenSharingAccPack(screensharingOptions);
    }

    if (!!AnnotationAccPack && _this.options.screensharing.annotation) {

      _annotation = new AnnotationAccPack(_.extend({}, _this.options, {
        accPack: _this,
        session: _session,
        onScreenCapture:_this.options.onScreenCapture || null
      }));
    }

    if (!!ArchivingAccPack) {

      var archivingOptions = {
        accPack: _this,
        session: _session,
        startURL: [api.url, '/archive/start'].join(''),
        stopURL: [api.url, '/archive/stop'].join('')
      };
      _archiving = new ArchivingAccPack(archivingOptions);
    }

    _setupEventListeners();

  });

  /**
   * @constructor
   * Provides a common layer for logic and API for accelerator pack components
   */
  var AccPackApi = function (options) {

    _this = this;
    _this.options = _validateOptions(options);

    _session = OT.initSession(options.apiKey, options.sessionId);
    _registerSessionEvents();

    // Connect
    _session.connect(options.token, function (error) {
      if (error) {
        triggerEvent('sessionError', error);
      }

      //Initialize the chat component once the user is connected to the session.
      _initTextChatComponent();

    });

    registerEventListener('startCall', _initAccPackComponents);

  };

  AccPackApi.prototype = {
    constructor: AccPackApi,
    registerEvents: registerEvents,
    triggerEvent: triggerEvent,
    registerEventListener: registerEventListener,
    removeEventListener: removeEventListener,
    getSession: getSession,
    getOptions: getOptions,
    setupAnnotationView: setupAnnotationView,
    setupExternalAnnotation: setupExternalAnnotation,
    linkAnnotation: linkAnnotation
  };

  if (typeof exports === 'object') {
    module.exports = AccPackApi;
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return AccPackApi;
    });
  } else {
    this.AccPackApi = AccPackApi;
  }

}.call(this));
