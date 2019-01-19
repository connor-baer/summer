// ==== UPDATE ==== //

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({ camelize: true });
const config = require('../../gulpconfig').update;

gulp.task('update-node', () => {
  gulp.watch('./package.json').on('change', file => {
    plugins.update.write(file);
  });
});

// Used to get around Sass's inability to properly @import vanilla CSS; see: https://github.com/sass/sass/issues/556
gulp.task('update-deps', () =>
  gulp
    .src(config.src)
    .pipe(plugins.changed(config.dest))
    .pipe(plugins.rename(config.rename))
    .pipe(gulp.dest(config.dest))
);

gulp.task('update', ['update-deps', 'update-node']);
