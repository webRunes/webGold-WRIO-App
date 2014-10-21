'use strict';

var StripeResource = require('../StripeResource');
var utils = require('../utils');
var stripeMethod = StripeResource.method;

module.exports = StripeResource.extend({

  path: 'customers',
  includeBasic: [
    'create', 'list', 'retrieve', 'update', 'del',
    'setMetadata', 'getMetadata'
  ],

});
