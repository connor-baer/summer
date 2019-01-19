// ==== CLEAN ==== //

const gulp = require('gulp');
const del = require('del');
const config = require('../../gulpconfig').clean;

// Totally wipe the contents of the directory to prepare for a clean build.
gulp.task('clean-wipe', () => del(config.wipe));

// Clean out junk files after build.
gulp.task('clean-tidy', ['clean-wipe'], () => del(config.tidy));

gulp.task('clean', ['clean-tidy']);
