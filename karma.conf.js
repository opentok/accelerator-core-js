module.exports = function(config) {
    var configuration = {
        basePath: '',
        frameworks: ['mocha', 'browserify'],
        files: [
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
