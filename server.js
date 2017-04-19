require('babel-register');
require('regenerator-runtime/runtime');

var init_serv = require('./app/server/index.js').default;
console.log(init_serv);
init_serv();
