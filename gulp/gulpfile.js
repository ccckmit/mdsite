var gulp = require('gulp')
var md2page = require('./gulp-md2page')
var path = require('path')

let webRoot = path.join(__dirname, '../')
console.log('webRoot=', webRoot)
gulp.task('md2page', function() {
  gulp.src(['../md/**/book.mdo', '../md/**/*.md'])
    .pipe(md2page({webRoot:webRoot}))
    .pipe(gulp.dest('../html/'))
  gulp.src(['../md/**/*.jpg', '../md/**/*.png'])
    .pipe(gulp.dest('../html/'))
})

gulp.task('default', [ 'md2page' ])
