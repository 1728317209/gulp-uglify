'use strict';
var through = require('through2');
var minify = require('./lib/minify');

module.exports = function(uglify, logger) {
  return function(opts) {
    var minifier = minify(uglify, logger)(opts);
    // through2.obj(transform, flush) 返回一个转换流 stream._transform = transform
    // transform(chunk, encoding, callback) // transform 的 3 个参数分别是 chunk, encoding, callback
    return through.obj(function(file, encoding, callback) {
      // file 是 Vinyl
      var newFile = null;
      var err = null;
      try {
        newFile = minifier(file); // transform 方法中通过 uglyfy-js 来压缩代码
      } catch (e) {
        err = e;
      }
      callback(err, newFile);
    });
  };
};
