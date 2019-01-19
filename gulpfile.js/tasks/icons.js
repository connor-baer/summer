// ==== IMAGES ==== //

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({ camelize: true });
const config = require('../../gulpconfig').icons;

// Generate icons.
gulp.task('icons', () => {
  const htmlFilter = plugins.filter(config.favicons.html, { restore: true });
  const iconsFilter = plugins.filter(['*', `!${config.favicons.html}`], {
    restore: true
  });

  return gulp
    .src(config.src)
    .pipe(plugins.favicons(config.favicons))
    .pipe(htmlFilter)
    .pipe(gulp.dest(config.destHtml))
    .pipe(htmlFilter.restore)
    .pipe(iconsFilter)
    .pipe(gulp.dest(config.dest));
});
