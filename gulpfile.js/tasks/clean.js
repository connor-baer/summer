// ==== CLEAN ==== //

var gulp = require('gulp'),
  del    = require('del'),
  config = require('../../gulpconfig').clean;

// Delete folders and files.
gulp.task('clean', function() {
  return del(config.src);
});
