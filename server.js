require("babel/register")({
    stage: 0
});

var app = require('./app');

module.exports = app;
