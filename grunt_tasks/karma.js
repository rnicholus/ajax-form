/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : '.',

        files : [
            'test/unit/bind-shim.js',
            'test/unit/polymer-mock.js',
            'element/*.js',
            'test/unit/*-spec.js'
        ],

        frameworks: ['jasmine'],

        plugins : [
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-spec-reporter'
        ],

        reporters : [
            'spec',
        ],

        singleRun: true

    },
    dev: {
        browsers: ['PhantomJS']
    },
    travis: {
        browsers: ['PhantomJS', 'Firefox']
    }
};