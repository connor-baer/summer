// ==== GULPFILE ==== //

// This configuration follows the modular design of the `gulp-starter` project by Dan Tello: https://github.com/greypants/gulp-starter
// Explore `tasks` for more...

const requireDir = require('require-dir');

// Require all tasks in gulp/tasks, including subfolders
requireDir('./tasks', { recurse: true });
