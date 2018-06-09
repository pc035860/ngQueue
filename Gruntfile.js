var DOC_ROOT = 'example';

var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT });
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {
  grunt.initConfig({
    fileName: 'ngQueue',
    docRoot: DOC_ROOT,
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true
      },
      beforeuglify: ['<%= fileName %>.js'],
      gruntfile: ['Gruntfile.js']
    },
    umd: {
      build: {
        options: {
          src: '<%= fileName %>.js',
          dest: '<%= fileName %>.umd.js',

          deps: {
            'default': ['angular']
          }
        }
      }
    },
    uglify: {
      build: {
        src: '<%= fileName %>.umd.js',
        dest: '<%= fileName %>.min.js'
      },
      options: {
        mangle: true,
        compress: {},
        banner: 
          '/*! <%= fileName %>\n' + 
          'version: <%= pkg.version %>\n' +
          'build date: <%= grunt.template.today("yyyy-mm-dd") %>\n' + 
          'author: <%= pkg.author %>\n' + 
          '<%= pkg.repository.url %> */\n'
      }
    },
    clean: {
      build: ['<%= fileName %>.umd.js']
    },
    copy: {
      example: {
        src: '<%= fileName %>.js',
        dest: '<%= docRoot %>/lib/<%= fileName %>.js'
      }
    },
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile'],
      },
      src: {
        files: '<%= fileName %>.js',
        tasks: ['newer:jshint:beforeuglify', 'copy:example'],
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          '<%= fileName %>.js',
          '<%= docRoot %>/{,**/}*.{html,js,css}'
        ]
      }
    },
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, DOC_ROOT),
              connect.directory(DOC_ROOT)
            ];
          }
        }
      }
    },
    open: {
      server: {
        url: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('example', ['connect:livereload', 'open', 'watch']);

  grunt.registerTask('default', ['jshint:beforeuglify', 'umd', 'uglify', 'clean']);
};

