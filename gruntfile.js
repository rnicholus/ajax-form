/* jshint node:true */
function config(name) {
    return require('./grunt_tasks/' + name + '.js');
}

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: config('jshint'),
        'wct-test': {
            local: {
                options: {remote: false}
            },
            remote: {
                options: {remote: true}
            },
            chrome: {
                options: {browsers: ['chrome']}
            }
        },
        watch: {
            files: ['ajax-form.js', 'grunt_tasks/*.js', 'test/unit/*'],
            tasks: ['jshint', 'karma:dev']
        }
    });

    grunt.loadNpmTasks('web-component-tester');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');


    grunt.registerTask('default', ['jshint', 'wct-test:local']);
    grunt.registerTask('travis', ['jshint', 'wct-test:local']);
};
