'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _nconf = require('nconf');

var _nconf2 = _interopRequireDefault(_nconf);

_nconf2['default'].env().argv();

var basedirPath = _path2['default'].dirname(require.main.filename);
_nconf2['default'].file(_path2['default'].join(basedirPath, '/config.json'));

exports['default'] = _nconf2['default'];
module.exports = exports['default'];