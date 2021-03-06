module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '../',

        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'extension/src/dashboard/angular.js',
            'extension/src/dashboard/processors.js',
            'extension/src/dashboard/utils.js',
            'extension/src/dashboard/storage.js',
            'extension/src/dashboard/processors.js',
            'extension/src/dashboard/app.js',
            'extension/src/dashboard/betfair-api.js',
            'extension/src/inject/oddschecker/horse.js',
            'extension/src/inject/willhill/willhill.js',
            'extension/src/inject/betvictor/football.js',
            'extension/src/inject/betfair/exchange.js',
            'extension/src/inject/inject-lib.js',
            'extension/src/inject/jquery-2.1.1.min.js',
            'test/angular-mocks.js',
            'test/jasmine-jquery.js',

            {pattern: 'test/html/*.html', watched: true, served: true, included: false},

            'test/app-spec.js',
            'test/scrapers-spec.js'
        ],

        // list of files to exclude
        exclude: [
            'src/dashboard/dashboard.js'
        ],

        // use dots reporter, as travis terminal does not support escaping sequences
        // possible values: 'dots', 'progress'
        // CLI --reporters progress
        reporters: ['progress', 'junit'],

        junitReporter: {
            // will be resolved to basePath (in the same way as files/exclude patterns)
            //outputFile: 'test-results.xml'
        },

        // web server port
        // CLI --port 9876
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        // CLI --colors --no-colors
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        // CLI --log-level debug
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        // CLI --auto-watch --no-auto-watch
        //autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        // CLI --browsers Chrome,Firefox,Safari
        browsers: ['Chrome'],

        // If browser does not capture in given timeout [ms], kill it
        // CLI --capture-timeout 5000
        captureTimeout: 20000,

        // Auto run tests on start (when browsers are captured) and exit
        // CLI --single-run --no-single-run
        singleRun: false,

        // report which specs are slower than 500ms
        // CLI --report-slower-than 500
        reportSlowerThan: 500,

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-junit-reporter',
            'karma-commonjs'
        ]
    });
};