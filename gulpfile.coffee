path = require('path')
gulp = require('gulp')
mocha = require('gulp-mocha')
gutil = require('gulp-util')
coffeelint = require('gulp-coffeelint')
coffee = require('gulp-coffee')

OPTIONS =
	config:
		coffeelint: path.join(__dirname, 'coffeelint.json')
	files:
		coffee: [ 'lib/**/*.coffee', 'tests/**/*.spec.coffee', 'gulpfile.coffee' ]
		app: 'lib/**/*.coffee'
		tests: 'tests/**/*.spec.coffee'

gulp.task 'coffee', ->
	gulp.src(OPTIONS.files.app)
		.pipe(coffee(bare: true, header: true)).on('error', gutil.log)
		.pipe(gulp.dest('build/'))

gulp.task 'test', ['lint'], ->
	gulp.src(OPTIONS.files.tests, read: false)
		.pipe(mocha({
			bail: true,
			compilers: 'coffee:coffee-script/register'
		}))

gulp.task 'lint', ['coffee'], ->
	gulp.src(OPTIONS.files.coffee)
		.pipe(coffeelint({
			optFile: OPTIONS.config.coffeelint
		}))
		.pipe(coffeelint.reporter())

gulp.task 'build', [
	'lint'
	'test'
	'coffee'
]

gulp.task 'watch', [ 'build' ], ->
	gulp.watch(OPTIONS.files.coffee, [ 'build' ])
