/* jshint node:true */
function config(name) {
    return require('./grunt_tasks/' + name + '.js');
}

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: config('jshint'),
        karma: config('karma'),
        watch: {
            files: ['ajax-form.js', 'grunt_tasks/*.js', 'test/unit/*'],
            tasks: ['jshint', 'karma:dev']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['jshint', 'karma:dev']);
    grunt.registerTask('travis', ['jshint', 'karma:travis']);
};