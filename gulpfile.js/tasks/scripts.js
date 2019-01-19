// ==== SCRIPTS ==== //

const gulp = require('gulp');
const merge = require('merge-stream');
const plugins = require('gulp-load-plugins')({ camelize: true });
const config = require('../../gulpconfig').scripts;

// Generate script bundles as defined in the configuration file
// Adapted from https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
gulp.task('scripts-bundle', () => {
  const bundles = [];

  // Iterate through all bundles defined in the configuration
  for (const bundle in config.bundles) {
    if (config.bundles.hasOwnProperty(bundle)) {
      var chunks = [];

      // Iterate through each bundle and mash the chunks together
      config.bundles[bundle].forEach(chunk => {
        chunks = chunks.concat(config.chunks[chunk]);
      });

      // Push the results to the bundles array
      bundles.push([bundle, chunks]);
    }
  }

  // Iterate through each bundle in the bundles array
  const tasks = bundles.map(bundle =>
    gulp
      .src(bundle[1]) // bundle[1]: the list of source files
      .pipe(plugins.concat(`${bundle[0].replace(/_/g, '-')}.js`)) // bundle[0]: the nice name of the script; underscores are replaced with hyphens
      .pipe(gulp.dest(config.dest))
  );

  // Cross the streams ;)
  return merge(tasks);
});

// Minify scripts in place
gulp.task('scripts-minify', ['scripts-bundle'], () =>
  gulp
    .src(config.minify.src)
    .pipe(plugins.sourcemaps.init())
    .pipe(
      plugins.babel({
        presets: ['@babel/env']
      })
    )
    .pipe(plugins.uglify(config.minify.uglify))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(config.minify.dist + config.minify.dest))
    .pipe(gulp.dest(config.minify.dest))
);

// Master script task; lint -> bundle -> minify
gulp.task('scripts', ['scripts-minify']);
