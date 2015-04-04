/* jshint node:true */
function config(name) {
    return require('./grunt_tasks/' + name + '.js');
}

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: config('jshint'),
        'wct-test': {
            desktop: {
                options: {
                    browsers: ['chrome', 'safari'],
                    remote: false
                }
            },
            remote: {
                options: {remote: true}
            }
        },
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
            }
        }
    });

    grunt.loadNpmTasks('web-component-tester');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['jshint', 'wct-test:desktop']);
    grunt.registerTask('travis', ['jshint', 'wct-test:remote']);
    grunt.registerTask('publishToNpm', ['jshint', 'wct-test:desktop', 'copy:npmPreRelease', 'shell:npmRelease']);
};
