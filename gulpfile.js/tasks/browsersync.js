// ==== BROWSERSYNC ==== //

const gulp = require('gulp');
const browsersync = require('browser-sync');
const config = require('../../gulpconfig').browsersync;

// Quick start: connect all your devices to the same network (e.g. wifi) and navigate to the address output in the console when you run `gulp`
gulp.task('browsersync', ['build'], () => {
  browsersync(config);
});
