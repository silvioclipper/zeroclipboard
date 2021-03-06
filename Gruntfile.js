/*jshint -W106 */
/*jshint node:true, maxstatements: false, maxlen: false */

var os = require("os");
var path = require("path");

module.exports = function(grunt) {
  "use strict";

  // Metadata
  var pkg = grunt.file.readJSON("package.json");

  // Make a temp dir for Flash compilation
  var tmpDir = os.tmpdir ? os.tmpdir() : os.tmpDir();
  var flashTmpDir = path.join(tmpDir, "zcflash");

  // Shared configuration
  var localPort = 7320;  // "ZERO"

  // Project configuration.
  grunt.initConfig({
    // Task configuration
    jshint: {
      options: {
        jshintrc: true
      },
      Gruntfile: ["Gruntfile.js"],
      js: ["src/javascript/ZeroClipboard/**/*.js"],
      test: ["test/*.js"]
    },
    flexpmd: {
      flash: {
        src: [flashTmpDir]
      }
    },
    clean: {
      dist: ["ZeroClipboard.*"],
      flash: {
        options: {
          // Force is required when trying to clean outside of the project dir
          force: true
        },
        src: [flashTmpDir]
      },
      meta: ["bower.json", "composer.json", "LICENSE"]
    },
    concat: {
      options: {
        stripBanners: true,
        process: {
          data: pkg
        }
      },
      js: {
        src: [
          "src/meta/source-banner.tmpl",
          "src/javascript/start.js",
          "src/javascript/ZeroClipboard/state.js",
          "src/javascript/ZeroClipboard/utils.js",
          "src/javascript/ZeroClipboard/flash.js",
          "src/javascript/ZeroClipboard/client.js",
          "src/javascript/ZeroClipboard/core.js",
          "src/javascript/ZeroClipboard/dom.js",
          "src/javascript/ZeroClipboard/event.js",
          "src/javascript/ZeroClipboard/deprecated.js",
          "src/javascript/end.js"
        ],
        dest: "ZeroClipboard.js"
      },
      flashMain: {
        src: [
          "src/meta/source-banner.tmpl",
          "src/flash/ZeroClipboard.as"
        ],
        dest: path.join(flashTmpDir, "ZeroClipboard.as")
      },
      flashClip: {
        src: [
          "src/meta/source-banner.tmpl",
          "src/flash/ClipboardInjector.as"
        ],
        dest: path.join(flashTmpDir, "ClipboardInjector.as")
      },
      flashJs: {
        src: [
          "src/meta/source-banner.tmpl",
          "src/flash/JsProxy.as"
        ],
        dest: path.join(flashTmpDir, "JsProxy.as")
      },
      flashXss: {
        src: [
          "src/meta/source-banner.tmpl",
          "src/flash/XssUtils.as"
        ],
        dest: path.join(flashTmpDir, "XssUtils.as")
      }
    },
    uglify: {
      options: {
        preserveComments: "some",
        report: "min"
      },
      js: {
        options: {
          beautify: {
            beautify: true,
            // `indent_level` requires jshint -W106
            indent_level: 2
          },
          mangle: false,
          compress: false
        },
        src: ["ZeroClipboard.js"],
        dest: "ZeroClipboard.js"
      },
      minjs: {
        src: ["ZeroClipboard.js"],
        dest: "ZeroClipboard.min.js"
      }
    },
    mxmlc: {
      options: {
        rawConfig: "-target-player=11.0.0 -static-link-runtime-shared-libraries=true"
      },
      swf: {
        files: {
          "ZeroClipboard.swf": ["<%= concat.flashMain.dest %>"]
        }
      }
    },
    template: {
      options: {
        data: pkg
      },
      bower: {
        files: {
          "bower.json": ["src/meta/bower.json.tmpl"]
        }
      },
      composer: {
        files: {
          "composer.json": ["src/meta/composer.json.tmpl"]
        }
      },
      LICENSE: {
        files: {
          "LICENSE": ["src/meta/LICENSE.tmpl"]
        }
      }
    },
    chmod: {
      options: {
        mode: "444"
      },
      dist: ["ZeroClipboard.*"],
      meta: ["bower.json", "composer.json", "LICENSE"]
    },
    connect: {
      server: {
        options: {
          port: localPort
        }
      }
    },
    qunit: {
      file: ["test/**/*.js.html"],
      http: {
        options: {
          urls: grunt.file.expand(["test/**/*.js.html"]).map(function(testPage) {
            return "http://localhost:" + localPort + "/" + testPage + "?noglobals=true";
          })
        }
      }
    },
    watch: {
      options: {
        spawn: false
      },
      Gruntfile: {
        files: "<%= jshint.Gruntfile %>",
        tasks: ["jshint:Gruntfile"]
      },
      js: {
        files: "<%= jshint.js %>",
        tasks: ["jshint:js", "unittest"]
      },
      test: {
        files: "<%= jshint.test %>",
        tasks: ["jshint:test", "unittest"]
      }
    }
  });

  // These plugins provide necessary tasks
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-flexpmd");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-mxmlc");
  grunt.loadNpmTasks("grunt-template");
  grunt.loadNpmTasks("grunt-chmod");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-contrib-watch");


  //
  // Task aliases and chains
  //
  grunt.registerTask("prep-flash",   ["clean:flash", "concat:flashMain", "concat:flashClip", "concat:flashJs", "concat:flashXss"]);
  grunt.registerTask("validate",     ["jshint", "prep-flash", "flexpmd"]);
  grunt.registerTask("build",        ["clean", "concat", "uglify", "mxmlc", "template", "chmod"]);
  grunt.registerTask("build-travis", ["clean:dist", "concat", "mxmlc", "chmod:dist"]);
  grunt.registerTask("test",         ["connect", "qunit"]);

  // Default task
  grunt.registerTask("default", ["validate", "build", "test"]);
  // Travis CI task
  grunt.registerTask("travis",  ["validate", "build-travis", "test"]);

};
