'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrio_nconf = require('./wrio_nconf');

var _wrio_nconf2 = _interopRequireDefault(_wrio_nconf);

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: _wrio_nconf2['default'].get('db:host'),
    user: _wrio_nconf2['default'].get('db:user'),
    password: _wrio_nconf2['default'].get('db:password'),
    database: _wrio_nconf2['default'].get('db:dbname')
});

exports['default'] = connection;
module.exports = exports['default'];