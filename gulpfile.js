/**
 * gulpfile.js for windowbuilder.js
 *
 * Created 12.12.2015<br />
 * @author  Evgeniy Malyarov
 */

var gulp = require('gulp');
module.exports = gulp;
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Cборка отладочного проекта
gulp.task('linear-solver', function(){
	gulp.src([
		'./lib/genetic.js',
		'./src/cutting.js',
		'./src/visualization.js',
		'./src/linear-solver.js'
	])
		.pipe(concat('linear-solver.js'))
		.pipe(gulp.dest('./dist'))
		.pipe(rename('linear-solver.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./dist'))
	;
});
