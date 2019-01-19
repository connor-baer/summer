// ==== JEKYLL ==== //

const gulp = require('gulp');
const cp = require('child_process');
const browsersync = require('browser-sync');
const config = require('../../gulpconfig').jekyll;

// Build the Jekyll Site.
gulp.task('jekyll-rebuild', done =>
  cp
    .spawn(
      'jekyll',
      [
        'build',
        '-q',
        `--source=${config.src}`,
        `--destination=${config.dest}`,
        `--config=${config.config}`
      ],
      { stdio: 'inherit' }
    )
    .on('close', done)
);

gulp.task('jekyll', ['jekyll-rebuild'], () => {
  browsersync.reload();
});
