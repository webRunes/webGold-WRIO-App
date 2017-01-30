

import logger from 'winston';

var _ = require('underscore');
var Tx = require('ethereumjs-tx');
var BigNumber = require('bignumber.js');
var JSZip = require("jszip");
var crypto = require('crypto');
import CryptoJS from 'crypto-js';

var window = {};



/**
 Pad the given string with a prefix zero, if length is uneven.

 @method (formatHex)
 @param {String} str    The string to pad for use as hex
 @return {String} The padded or formatted string for use as a hex string
 **/

export function formatHex(str) {
    return '0x'+ (String(str).length % 2 ? '0' + String(str) : String(str));
}

/**
 Prepair numbers for raw transactions.

 @method (formatNumber)
 @param {Number|String|BigNumber} The object to be used as a number
 @return {String} The padded, toString hex value of the number
 **/

export function formatNumber(num) {
    if (_.isUndefined(num) || num == 0) num = '00';

    if (_.isString(num) || _.isNumber(num)) num = new BigNumber(String(num));

    if (isBigNumber(num)) num = num.toString(16);

    return formatHex(num);
};

/**
 Prepair Ethereum address for either raw transactions or browser storage.

 @method (formatAddress)
 @param {String} addr    An ethereum address to prep
 @param {String} format          The format type (i.e. 'raw' or 'hex')
 @return {String} The prepaired ethereum address
 **/

export function formatAddress(addr, format) {
    if (_.isUndefined(format) || !_.isString(format)) format = 'hex';

    if (_.isUndefined(addr) || !_.isString(addr)) addr = '0000000000000000000000000000000000000000';

    if (addr.substr(0, 2) == '0x' && format == 'raw') addr = addr.substr(2);

    if (addr.substr(0, 2) != '0x' && format == 'hex') addr = '0x' + addr;

    return addr;
};

/**
 Generate 16 random alpha numeric bytes.

 @method (randomBytes)
 @param {Number} length      The string length that should be generated
 @return {String} A 16 char/UTF-8 byte string of random alpha-numeric characters
 **/

export function randomBytes(length) {
    var charset = "abcdef0123456789";
    var i;
    var result = "";
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';

    var values = crypto.randomBytes(length);
    for (i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }

    return result;
};

/**
 Is the object provided a Bignumber object.

 @method (isBigNumber)
 **/

export function isBigNumber(value) {
    if (_.isUndefined(value) || !_.isObject(value)) return false;

    return value instanceof BigNumber ? true : false;
};

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 **/

export function isAddress(address) {
    return (/^(0x)?[0-9a-f]{40}$/.test(address)
    );
};



/**
 The Accounts constructor method. This method will construct the in browser Ethereum accounts manager.

 @class Accounts
 @constructor
 @method (Accounts)
 @param {Object} options       The accounts object options.
 **/