module.exports = function(config) {
    var configuration = {
        plugins: [
           'karma-mocha', 'karma-coverage', 'karma-html2js-preprocessor', 'karma-chrome-launcher', 'karma-chai', 'karma-browserify'
        ],
        basePath: '',
        frameworks: ['mocha', 'browserify', 'chai'],
        client: {
            contextFile: '/test/index.html'
        },
        files: [
          'https://static.opentok.com/v2/js/opentok.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.js',
          'test/communication-test.js',
          'test/core-test.js',
          'test/state-test.js'
        ],
        exclude: [
        ],
        preprocessors: {
            'test/*.html': ['html2js'],
            'src/*.js': ['coverage'],
            'test/*.js': ['browserify'],
            'src/*.js': ['browserify']
        },
        reporters: ['progress', 'coverage'],
        port: 9877,
        colors: true,
        autoWatch: true,
        browsers: [],
        singleRun: true,
        browserify: {
          debug: true,
          transform: [
            ['babelify', {plugins: ['babel-plugin-espower']}]
          ]
        },
        logLevel: config.LOG_INFO,
        coverageReporter: {
            dir: 'test/coverage',
            instrumenter: {
                'src/*.js': ['istanbul']
            },
            reporters: [
                { type: 'html', subdir: 'report-html' },
                { type: 'lcov', subdir: 'report-lcov' },
                { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' }
            ]
        },
        customLaunchers: {
          Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
          }
        }
    };

  if (process.env.TRAVIS) {
      configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);

};
