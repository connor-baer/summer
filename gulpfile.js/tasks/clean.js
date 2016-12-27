// ==== CLEAN ==== //

var gulp   = require('gulp'),
    del    = require('del'),
    config = require('../../gulpconfig').clean
;


// Totally wipe the contents of the directory to prepare for a clean build.
gulp.task('clean-wipe', function() {
  return del(config.wipe);
});


// Clean out junk files after build.
gulp.task('clean-tidy', ['clean-wipe'], function() {
  return del(config.tidy);
});


gulp.task('clean', ['clean-tidy']);
