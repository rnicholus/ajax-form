/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : '.',

        files : [
            'bower_components/bind-polyfill/index.js',
            'ajax-form.js',
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