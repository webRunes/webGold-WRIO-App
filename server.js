require('babel-core/register');
require('regenerator-runtime/runtime');

var app = require('./app/server/index.js');

module.exports = app;
