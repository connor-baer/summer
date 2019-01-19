// ==== GULP CONFIGURATION ==== //

// 1. Variables
// 2. BrowserSync
// 3. Watch
// 4. Update
// 5. Clean
// 6. Styles
// 7. Scripts
// 8. Images
// 9. Icons
// 10. Jekyll

// 1. Variables //

const pkg = require('./package.json');
// Allows access to the project metadata from the package.json file.

const src = '';
// The raw material of the theme: custom scripts, SCSS source files, images, etc.; do not delete this folder!

const dist = `${src}_site/`;
// The distribution package that you'll be uploading to your server; delete it anytime.

const assets = 'assets/';
// A staging area for assets that require processing before landing in the source folder (example: icons before being added to a sprite sheet).

const nodeModules = 'node_modules/';
// NPM packages.
module.exports = {
  // 2. BrowserSync

  browsersync: {
    server: {
      baseDir: dist
    },
    files: [`${dist}**/*`],
    port: 4000, // Port number for the live version of the site; jekyll default: 4000
    notify: false, // In-line notifications (the blocks of text saying whether you are connected to the BrowserSync server or not)
    ui: false, // Set to false if you don't need the browsersync UI
    open: false, // Set to false if you don't like the browser window opening automatically
    reloadDelay: 1000, // Time, in milliseconds, to wait before reloading/injecting
    watchOptions: {
      debounceDelay: 4000 // This introduces a small delay when watching for file change events to avoid triggering too many reloads
    }
  },

  // 3. Watch //

  watch: {
    jekyll: [
      '_config.yml',
      `${src}_data/**/*.{json,yml,yaml,csv}`,
      `${src}_includes/**/*.html`,
      `${src}_layouts/*.html`,
      `${src}_posts/*.md`,
      `${src}*/*.{html,md,yml,yaml,txt}`,
      `${src}*.{html,md,yml,yaml,txt}`,
      `!${nodeModules}`,
      `!${dist}`
    ],
    styles: `${src}_scss/**/*.scss`,
    scripts: `${src}_js/*.js`,
    images: `${src}_images/**/*`
  },

  // 4. Update  //

  update: {
    // Copies dependencies from package managers to `_scss` and renames them to allow for them to be imported as a Sass file.
    src: [
      `${nodeModules}normalize.css/normalize.css`,
      `${nodeModules}open-color/open-color.scss`
    ],
    dest: '_scss/core',
    rename: {
      prefix: '_',
      extname: '.scss'
    }
  },

  // 5. Clean //

  clean: {
    tidy: [`${src}**/.DS_Store`], // A glob pattern matching junk files to clean out of `build`; feel free to add to this array.
    wipe: [dist + assets] // Clean this out before creating a new distribution copy.
  },

  // 6. Styles //

  styles: {
    build: {
      src: `${src}_scss/**/*.scss`,
      dest: assets,
      dist
    },
    cssnano: {
      autoprefixer: {
        add: true,
        browsers: ['> 3%', 'last 2 versions', 'ie 9', 'ios 6', 'android 4'] // This tool is magic and you should use it in all your projects :)
      }
    },
    libsass: {
      // Requires the libsass implementation of Sass (included in this package)
      includePaths: [nodeModules], // Adds node modules to the load path so you can @import directly
      precision: 6,
      onError(err) {
        return console.error(err);
      }
    }
  },

  // 7. Scripts //

  scripts: {
    bundles: {
      // Bundles are defined by a name and an array of chunks (below) to concatenate; warning: this method offers no dependency management!
      scripts: ['core', 'search', 'custom']
    },
    chunks: {
      // Chunks are arrays of paths or globs matching a set of source files; this way you can organize a bunch of scripts that go together into pieces that can then be bundled (above)
      // The core chunk is loaded no matter what; put essential scripts that you want loaded by your theme in here
      core: [
        `${nodeModules}smooth-scroll/dist/smooth-scroll.js`,
        `${src}_js/core.js`
      ],
      search: [`${nodeModules}list.js/dist/list.min.js`, `${src}_js/custom.js`],
      custom: [`${src}_js/custom.js`]
    },
    dest: assets, // Where the scripts end up in your theme
    minify: {
      src: `${assets}**/*.js`,
      uglify: {}, // Default options
      dest: assets,
      dist
    }
  },

  // 8. Images //

  images: {
    resize: {
      src: [`${src}_images/**/*(*.png|*.jpg|*.jpeg|*.gif|*.svg)`],
      responsive: {
        // Convert all images to JPEG format.
        'posts/*': [
          {
            // post.jpg is 1000 pixels wide.
            width: 1000,
            withoutEnlargement: false,
            rename: {
              extname: '.jpg'
            }
          },
          {
            // post-large.jpg is 2000 pixels wide.
            width: 1000 * 2,
            withoutEnlargement: false,
            rename: {
              suffix: '-large',
              extname: '.jpg'
            }
          },
          {
            // post-small.jpg is 500 pixels wide.
            width: 1000 / 2,
            withoutEnlargement: false,
            rename: {
              suffix: '-small',
              extname: '.jpg'
            }
          }
        ],
        // Convert all images to JPEG format.
        'authors/*': [
          {
            // author.jpg is 500 pixels wide.
            width: 500,
            withoutEnlargement: false,
            rename: {
              extname: '.jpg'
            }
          },
          {
            // author-large.jpg is 1000 pixels wide.
            width: 500 * 2,
            withoutEnlargement: false,
            rename: {
              suffix: '-large',
              extname: '.jpg'
            }
          },
          {
            // author-small.jpg is 250 pixels wide.
            width: 500 / 2,
            withoutEnlargement: false,
            rename: {
              suffix: '-small',
              extname: '.jpg'
            }
          }
        ]
      },
      options: {
        errorOnUnusedImage: false,
        silent: true
      },
      dest: `${src + assets}images/`
    }
  },

  // 9. Icons //

  icons: {
    src: [`${src}_images/icons/*(*.png|*.jpg|*.jpeg)`],
    favicons: {
      appName: pkg.name,
      appDescription: pkg.description,
      developerName: pkg.author,
      background: '#ffffff',
      theme_color: '#fab005',
      path: `${src + assets}icons/`,
      url: pkg.homepage,
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/index.html',
      version: pkg.version,
      logging: false,
      online: false,
      replace: true,
      html: `${src}_includes/core/icons.html`,
      pipeHTML: true,
      icons: {
        android: true, // Create Android homescreen icon. `boolean`
        appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset: offsetInPercentage }`
        appleStartup: false, // Create Apple startup images. `boolean`
        coast: { offset: 15 }, // Create Opera Coast icon with offset 25%. `boolean` or `{ offset: offsetInPercentage }`
        favicons: true, // Create regular favicons. `boolean`
        firefox: true, // Create Firefox OS icons. `boolean` or `{ offset: offsetInPercentage }`
        windows: true, // Create Windows 8 tile icons. `boolean`
        yandex: false // Create Yandex browser icon. `boolean`
      }
    },
    destHtml: src,
    dest: `${src + assets}icons/`
  },

  // 10. Jekyll //

  jekyll: {
    src,
    dest: dist,
    config: '_config.yml'
  }
};
