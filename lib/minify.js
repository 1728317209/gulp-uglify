'use strict';
var Buffer = require('safe-buffer').Buffer;
var applySourceMap = require('vinyl-sourcemaps-apply');
var isObject = require('isobject');
var extend = require('extend-shallow');
var createError = require('./create-error');

module.exports = function(uglify, log) {
  function setup(opts) {
    if (opts && !isObject(opts)) {
      log.warn('gulp-uglify expects an object, non-object provided');
      opts = {};
    }

    return extend(
      {},
      {
        output: {}
      },
      opts
    );
  }

  return function(opts) {
    return function(file) {
      // file 是 Vinyl
      var options = setup(opts || {});
      var hasSourceMaps = Boolean(file.sourceMap);

      // isNull 是 Vinyl 的实例方法
      if (file.isNull()) {
        return file;
      }

      // isStream 是 Vinyl 的实例方法
      if (file.isStream()) {
        throw createError(file, 'Streaming not supported', null);
      }

      if (hasSourceMaps) {
        options.sourceMap = {
          filename: file.sourceMap.file,
          includeSources: true
        };

        // UglifyJS generates broken source maps if the input source map
        // does not contain mappings.
        if (file.sourceMap.mappings) {
          options.sourceMap.content = file.sourceMap;
        }
      }

      var fileMap = {};
      fileMap[file.relative] = String(file.contents);

      var mangled = uglify.minify(fileMap, options); // uglify-js 来压缩代码 AST

      if (!mangled || mangled.error) {
        throw createError(
          file,
          'unable to minify JavaScript',
          mangled && mangled.error
        );
      }

      if (mangled.warnings) {
        mangled.warnings.forEach(function(warning) {
          log.warn('gulp-uglify [%s]: %s', file.relative, warning);
        });
      }

      // Buffer.from 创建一个 Buffer
      // Vinyl.contents 是 ReadableStream | Buffer | null
      file.contents = Buffer.from(mangled.code);

      if (hasSourceMaps) {
        var sourceMap = JSON.parse(mangled.map);
        applySourceMap(file, sourceMap);
      }

      return file;
    };
  };
};
