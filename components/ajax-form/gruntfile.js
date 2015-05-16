/* jshint node:true */
function config(name) {
    return require('./grunt_tasks/' + name + '.js');
}

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: config('jshint'),
        watch: {
            files: ['ajax-form.js', 'grunt_tasks/*.js', 'test/unit/*'],
            tasks: ['jshint', 'karma:dev']
        },
        copy: {
            npmPreRelease: {
                files: [
                    {src: 'README.md', dest: 'dist/'},
                    {src: 'LICENSE', dest: 'dist/'},
                    {src: 'ajax-form.html', dest: 'dist/'},
                    {src: 'ajax-form.js', dest: 'dist/'},
                    {src: 'package.json', dest: 'dist/'}
                ]
            }
        },
        shell: {
            npmRelease: {
                command: [
                    'cd dist',
                    'npm publish'
                ].join('&&')
            },
            wctLocal: {
                command: [
                    'node_modules/.bin/wct --plugin local'
                ].join('&&')
            },
            wctSauce: {
                command: [
                    'node_modules/.bin/wct --plugin sauce'
                ].join('&&')
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['jshint', 'shell:wctLocal']);
    grunt.registerTask('travis', ['jshint', 'shell:wctSauce']);
    grunt.registerTask('publishToNpm', ['jshint', 'shell:wctLocal', 'copy:npmPreRelease', 'shell:npmRelease']);
};
