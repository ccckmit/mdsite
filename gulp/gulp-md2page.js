// from : https://github.com/sindresorhus/gulp-markdown/blob/master/index.js
'use strict';
var gutil = require('gulp-util')
var through = require('through2')
var marked = require('marked')
var path = require('path')
var fs = require('fs')
var mdo = require('mdo')
var katex = require('katex')

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
/*  
  highlight: function (code) {
    return highlight.highlightAuto(code).value;
  }
*/
})

var bookMap = {}

module.exports = function (options) {
	return through.obj(function (file, enc, cb) {
    console.log('options=%j file.path=%s', options, file.path)
    let relPath = file.path.substr((options.webRoot + 'md/').length)
    let dir = path.dirname(file.path).replace('\\', '/')
    let filename = path.parse(file.path).base
//    console.log('file.path=', file.path)
    if (file.path.endsWith('.mdo')) {
      let book = mdo.parseMdo(file.contents.toString())
      bookMap[dir] = book
      console.log('book=%j', book)
//      console.log('book=%j', book)
      cb(null, null)
    } else if (file.path.endsWith('.md')) {
      let md = file.contents.toString()
      let html = md2page(md, bookMap[dir], relPath)
      file.contents = new Buffer(html)
      file.path = gutil.replaceExtension(file.path, '.html')
      cb(null, file)
    }
	})
}

var katexApply = function (text) {
  let rzText = text.replace(/(```\w*\n([\s\S]*?)\n```)|(`[^`\n]*`)|(\$\$?\s*\n\s*([^$]+)\s*\n\s*\$\$?)|(\$\$?([^$\n]+)\$\$?)/gmi, function (match, p1, p2, p3, p4, p5, p6, p7, offset, str) {
    if (p1) {
      return match
    } else if (p3) {
      return match
    } else if (p4) {
      try {
        return katex.renderToString(p5, { displayMode: true }) || p5
      } catch (error) { return '|' + p4 + '|=> katex error!' }
    } else if (p6) {
      try {
        return katex.renderToString(p7) || p7
      } catch (error) { return '|' + p6 + '|=> katex error!' }
    }
  })
  return rzText
}

var mainTitle = function (title) {
  if (title.indexOf('=')>=0) title = title.match(/=(.*)$/)[1]
  return title
}

var menuHtml = function (book) {
  let list = []
  for (let chapter of book.chapters) {
    var title = mainTitle(chapter.title)
    list.push(`<li class="pure-menu-item"><a href="${chapter.link.replace(/\.md$/, '.html')}" class="pure-menu-link">${title}</a></li>`)
  }
  return list.join('\n')
}

var md2page = function (mdMain, book, relPath) {
//  console.log('before:md=', mdMain)
  if (mdMain.indexOf('$')>=0) mdMain = katexApply(mdMain)
  mdMain = mdMain.replace('/r', '')
  if (mdMain.indexOf('\nchinese:\n') >= 0) mdMain = mdMain.split('\nchinese:\n')[1]
  mdMain = mdMain.replace(/(\[.*?\]\(.*?)\.md\)/gi, '$1.html)')
                 .replace(/(\[.*?\]\(\..*?)\/\)/gi, '$1/README.html)')
//  console.log('after:md=', mdMain)
  let webRoot = relPath.replace(/[^\/\\]+/gi, '..').replace(/[\\]/gi, '/')
  book = book || {title:'', editor:'', chapters:[] }
  let footer = book.footer || ''
  let bookTitle = mainTitle(book.title)
  let mdTitleMatch = mdMain.match(/#+(.*)/)
  let mdTitle = (mdTitleMatch ? mdTitleMatch[1] : '')
  let htmlMain = marked(mdMain)
//  console.log('book.editor=', book.editor)
//  if (htmlMain.indexOf('$$')>=0) htmlMain = katexApply(htmlMain)
  console.log('relPath=%s webRoot=%s', relPath, webRoot)
  return `
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookTitle} >> ${mdTitle}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.9.0-alpha2/katex.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pure/0.6.2/pure-min.css">
    <link rel="stylesheet" href="${webRoot}/book.css">
</head>
<body>

<div class="header pure-menu pure-menu-horizontal">
  <ul id="topBar" class="pure-menu-list">
    <li id="bookTitle" class="pure-menu-item"><a href="README.html" class="pure-menu-link">${bookTitle}</a></li>
  </ul>
</div>

<div id="layout">
  <a href="#menu" id="menuLink" class="menu-link"><span></span></a>
  <div id="menu">
    <div id="sideMenu" class="pure-menu">
      <div id="home" class="pure-menu-heading">
        <a href="${webRoot}/index.html">⮌</a>
      </div>
      <ul class="pure-menu-list" id="bookBox">${menuHtml(book)}</ul>
    </div>
  </div>
  <div id="main">
    <div class="content" id="viewBox">
      <div id="mdBox">${htmlMain}</div>
      <div style="text-align:center">
        <span class="footnote">
        ${footer}
        </span>
      </div>
    </div>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
<script src="${webRoot}/book.js"></script>
</body>
</html>
`
}

/*

<!--

<script type="text/x-mathjax-config">
MathJax.Hub.Config(
  {
      tex2jax: 
      {
        inlineMath: [['$$','$$'], ['$','$'], ['\\(','\\)']],
        displayMath: [ ["\\[","\\]"] ],
        processEscapes: true    
      }
  }
);
</script>
<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>
*/