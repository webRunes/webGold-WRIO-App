/**
 * Created by michbil on 26.09.15.
 */
/**
 ethereumjs-accounts - A suite for managing Ethereum accounts in browser.

 Welcome to ethereumjs-accounts. Generate, encrypt, manage, export and remove Ethereum accounts and store them in your browsers local storage. You may also choose to extendWeb3 so that transactions made from accounts stored in browser, can be signed with the private key provided. EthereumJs-Accounts also supports account encryption using the AES encryption protocol. You may choose to optionally encrypt your Ethereum account data with a passphrase to prevent others from using or accessing your account.

 Requires:
 - cryptojs v0.3.1  <https://github.com/fahad19/crypto-js>
 - localstorejs *  <https://github.com/SilentCicero/localstore>
 - ethereumjs-tx v0.4.0  <https://www.npmjs.com/package/ethereumjs-tx>
 - ethereumjs-tx v1.2.0  <https://www.npmjs.com/package/ethereumjs-util>
 - Underscore.js v1.8.3+  <http://underscorejs.org/>
 - Web3.js v0.4.2+ <https://github.com/ethereum/web3.js>

 Commands:
 (Browserify)
 browserify --s Accounts index.js -o dist/ethereumjs-accounts.js

 (Run)
 node index.js

 (NPM)
 npm install ethereumjs-accounts

 (Meteor)
 meteor install silentcicero:ethereumjs-accounts
 **/

'use strict';

var _ = require('underscore');
var Tx = require('ethereumjs-tx');
var BigNumber = require('bignumber.js');
var JSZip = require("jszip");
var crypto = require('crypto');
global.CryptoJS = require('browserify-cryptojs');
require('browserify-cryptojs/components/enc-base64');
require('browserify-cryptojs/components/md5');
require('browserify-cryptojs/components/evpkdf');
require('browserify-cryptojs/components/cipher-core');
require('browserify-cryptojs/components/aes');




import Web3 from 'web3'; var web3 = new Web3();
import {dumpError} from '../utils.js'


class KeyStoreClass {
    constructor() {
        this.keys = {}
    }

    Get(key) {
        return this.keys[key];
    }

    Set(key,value,reactive,callback) {
        this.keys[key] = value;
        if (callback) {
            callback();
        }
    }
}

var window = {};
var KeyStore = new KeyStoreClass();

/**
 Pad the given string with a prefix zero, if length is uneven.

 @method (formatHex)
 @param {String} str    The string to pad for use as hex
 @return {String} The padded or formatted string for use as a hex string
 **/

function formatHex(str) {
    return String(str).length % 2 ? '0' + String(str) : String(str);
}

/**
 Prepair numbers for raw transactions.

 @method (formatNumber)
 @param {Number|String|BigNumber} The object to be used as a number
 @return {String} The padded, toString hex value of the number
 **/

function formatNumber(num) {
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

function formatAddress(addr, format) {
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

function randomBytes(length) {
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

function isBigNumber(value) {
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

function isAddress(address) {
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

class Accounts {


    constructor (options) {
        this.unlockedAccounts = {};
        if (_.isUndefined(options)) options = {};

        // setup default options
        var defaultOptions = {
            varName: 'ethereumAccounts',
            minPassphraseLength: 6,
            requirePassphrase: false,
            selectNew: true,
            defaultGasPrice: 'useWeb3',
            request: this.getAccountPassphrase
        };

        // build options
        this.options = _.extend(defaultOptions, options);

        if (options.KeyStore) {
            KeyStore = options.KeyStore;
        }



    };


    getAccountPassphrase(accountObject) {

        if (this.unlockedAccounts[accountObject.address]) {
            var val = this.unlockedAccounts[accountObject.address];
            delete this.unlockedAccounts[accountObject.address]; // delete passphrase, so cannot be used twice
            return val;
        } else {
            return null;
        }
    }

    unlockAccount(account,passphrase) {

        this.unlockedAccounts[account] = passphrase;

    };


    /**
     This will set in browser accounts data at a specified address with the specified accountObject data.

     @method (set)
     @param {String} address          The address of the account
     @param {Object} accountObject    The account object data.
     **/


    async set(address, accountObject) {

        await KeyStore.set(address, accountObject);
    };

    /**
     Remove an account from the Ethereum accounts stored in browser

     @method (remove)
     @param {String} address          The address of the account stored in browser
     **/

    async remove (address) {
        // TODO: add account removal
       // this.set(address, null);
    };

    /**
     Generate a new Ethereum account in browser with a passphrase that will encrypt the public and private keys with AES for storage.

     @method (new)
     @param {String} passphrase          The passphrase to encrypt the public and private keys.
     @return {Object} an account object with the public and private keys included.
     **/

    createUnencryptedAccount() {
        var privateKey = new Buffer(randomBytes(64), 'hex');
        var publicKey = ethUtil.privateToPublic(privateKey);
        var address = formatAddress(ethUtil.publicToAddress(publicKey).toString('hex'));
        var accountObject = {
            address: address,
            encrypted: false,
            locked: false,
            hash: ethUtil.sha3(publicKey.toString('hex') + privateKey.toString('hex')).toString('hex')
        };
        console.log("NEW:",privateKey.toString('hex'),publicKey.toString('hex'),accountObject);
    }

    async importAccount (address, privateKey, passphrase) {
        var privateKey = new Buffer(privateKey, 'hex');
        var publicKey = ethUtil.privateToPublic(privateKey);
        var accountObject = {
            address: address,
            encrypted: false,
            locked: false,
            hash: ethUtil.sha3(publicKey.toString('hex') + privateKey.toString('hex')).toString('hex')
        };

        // if passphrrase provided or required, attempt account encryption
        if (!_.isUndefined(passphrase) && !_.isEmpty(passphrase) || this.options.requirePassphrase) {
            if (this.isPassphrase(passphrase)) {
                privateKey = CryptoJS.AES.encrypt(privateKey.toString('hex'), passphrase).toString();
                publicKey = CryptoJS.AES.encrypt(publicKey.toString('hex'), passphrase).toString();
                accountObject.encrypted = true;
                accountObject.locked = true;
            } else {
                this.log('The passphrase you tried to use was invalid.');
                privateKey = privateKey.toString('hex');
                publicKey = publicKey.toString('hex');
            }
        } else {
            privateKey = privateKey.toString('hex');
            publicKey = publicKey.toString('hex');
        }

        // Set account object private and public keys
        accountObject['private'] = privateKey;
        accountObject['public'] = publicKey;
        this.set(address, accountObject);

        this.log('New address created');

        // If option select new is true
        //if (this.options.selectNew) this.select(accountObject.address);

        return accountObject;
    }

    async newAccount (passphrase) {
        var privateKey = new Buffer(randomBytes(64), 'hex');
        var publicKey = ethUtil.privateToPublic(privateKey);
        var address = formatAddress(ethUtil.publicToAddress(publicKey).toString('hex'));
        var accountObject = {
            address: address,
            encrypted: false,
            locked: false,
            hash: ethUtil.sha3(publicKey.toString('hex') + privateKey.toString('hex')).toString('hex')
        };

        // if passphrrase provided or required, attempt account encryption
        if (!_.isUndefined(passphrase) && !_.isEmpty(passphrase) || this.options.requirePassphrase) {
            if (this.isPassphrase(passphrase)) {
                privateKey = CryptoJS.AES.encrypt(privateKey.toString('hex'), passphrase).toString();
                publicKey = CryptoJS.AES.encrypt(publicKey.toString('hex'), passphrase).toString();
                accountObject.encrypted = true;
                accountObject.locked = true;
            } else {
                this.log('The passphrase you tried to use was invalid.');
                privateKey = privateKey.toString('hex');
                publicKey = publicKey.toString('hex');
            }
        } else {
            privateKey = privateKey.toString('hex');
            publicKey = publicKey.toString('hex');
        }

        // Set account object private and public keys
        accountObject['private'] = privateKey;
        accountObject['public'] = publicKey;
        this.set(address, accountObject);

        this.log('New address created');

        // If option select new is true
        //if (this.options.selectNew) this.select(accountObject.address);

        return accountObject;
    }

;


    /**
     Get an account object that is stored in local browser storage. If encrypted, decrypt it with the passphrase.

     @method (new)
     @param {String} passphrase          The passphrase to encrypt the public and private keys.
     @return {Object} an account object with the public and private keys included.
     **/


    async get (address, passphrase) {
        var accountObject = await KeyStore.get(address);
        address = formatAddress(address);

        // If a passphrase is provided, decrypt private and public key
        if (this.isPassphrase(passphrase) && accountObject.encrypted) {
            try {
                accountObject['private'] = CryptoJS.AES.decrypt(accountObject['private'], passphrase).toString(CryptoJS.enc.Utf8);
                accountObject['public'] = CryptoJS.AES.decrypt(accountObject['public'], passphrase).toString(CryptoJS.enc.Utf8);

                if (ethUtil.sha3(accountObject['public'] + accountObject['private']).toString('hex') == accountObject.hash) accountObject.locked = false;
            } catch (e) {
                this.log('Error while decrypting public/private keys: ' + String(e));
            }
        }

        return accountObject;
    };

    /**
     Select the account that will be used when transactions are made.
     @method (select)
     @param {String} address          The address of the account to select
     **/

    async select (address) {
    var accounts = await KeyStore.get(this.options.varName);

    if(!this.contains(address))
        return;

    accounts['selected'] = address;
    LocalStore.set(this.options.varName, accounts);
};


    /**
     Does the account exist in browser storage, given the specified account address.

     @method (contains)
     @param {String} address          The account address
     @return {Boolean} Does the account exists or not given the specified address
     **/

    contains (address) {

        return false; // a little stub there for now

    };



    /**
     Import a JSON ready string. This will import JSON data, parse it, and attempt to use it as accounts data.

     @method (import)
     @param {String} A JSON ready string
     @return {String} How many accountObject's were added
     **/


   /* importAccount (JSON_data) {
        var JSON_data = JSON_data.trim();
        var parsed = JSON.parse(JSON_data);
        var count = 0;
        var _this = this;

        _.each(parsed, function (accountObject, accountIndex) {
            if (!_.has(accountObject, 'private') || !_.has(accountObject, 'hash') || !_.has(accountObject, 'address') || !_.has(accountObject, 'encrypted') || !_.has(accountObject, 'locked')) return;

            count += 1;
            _this.set(accountObject.address, accountObject);
        });

        this.log('Imported ' + String(count) + ' accounts');

        return count;
    }*/

;

    /**
     A log function that will log all actions that occur with ethereumjs-accounts.

     @method (log)
     **/


    log (text) {
        console.log(text);
    };


    /**
     Alias for contains(), but asynchronous.

     This method is required to be a part of the transaction_signer specification for
     the HookedWeb3Provider.

     @method (hasAddress)
     **/

    hasAddress (address, callback) {

        KeyStore.get(address).then(function() {
            callback(null, address);
        }).catch((err)=>{
            callback(err);
        });
    };

    /**
     This will sign a transaction based on transaction parameters passed to it.
     If the from address is not registered as an in-browser account, signTransaction
     will respond with an error.

     This method is required to be a part of the transaction_signer specification for
     the HookedWeb3Provider.

     tx_params should be an object passed directly from web3. All data should be hex
     and start with the prefix "0x". nonce is required.

     @method (signTransaction)
     **/

    signTransaction (tx_params, callback) {
        var accounts = this;
        // Accounts instance
        (async () => { // async function wrapper
            try {
                console.log("Signing transaction",tx_params);
                // Get the account of address set in sendTransaction options, from the accounts stored in browser
                var account = await accounts.get(tx_params.from);

                // if the account is encrypted, try to decrypt it
                if (account.encrypted) {
                    console.log("Trying to decrypt account....");
                    account = await accounts.get(tx_params.from, accounts.getAccountPassphrase(account));
                }

                // if account is still locked, quit
                if (account.locked) {
                    callback(new Error("Cannot sign transaction. Account locked!"));
                    return;
                }

                if (!tx_params.gasPrice) {
                    tx_params.gasPrice = formatHex(new BigNumber(web3.toWei(60, 'gwei')).toString(16));
                }

                var rawTx = {
                    nonce: formatHex(ethUtil.stripHexPrefix(tx_params.nonce)),
                    gasPrice: formatHex(ethUtil.stripHexPrefix(tx_params.gasPrice)),
                    gasLimit: formatHex(new BigNumber('314159').toString(16)),
                    value: '00',
                    data: ''
                };

                if (tx_params.gasPrice != null) rawTx.gasPrice = formatHex(ethUtil.stripHexPrefix(tx_params.gasPrice));

                if (tx_params.gas != null) rawTx.gasLimit = formatHex(ethUtil.stripHexPrefix(tx_params.gas));

                if (tx_params.to != null) rawTx.to = formatHex(ethUtil.stripHexPrefix(tx_params.to));

                if (tx_params.value != null) rawTx.value = formatHex(ethUtil.stripHexPrefix(tx_params.value));

                if (tx_params.data != null) rawTx.data = formatHex(ethUtil.stripHexPrefix(tx_params.data));

                // convert string private key to a Buffer Object
                var privateKey = new Buffer(account['private'], 'hex');


                console.log(rawTx);

                // init new transaction object, and sign the transaction
                var tx = new Tx(rawTx);
                tx.sign(privateKey);

                //console.log(tx);
                //console.log(tx.getUpfrontCost());
                // Build a serialized hex version of the Tx
                var serializedTx = '0x' + tx.serialize().toString('hex');

                callback(null, serializedTx);
            } catch (e) {
                console.log("Error during signtransaction",e);
                dumpError(e);
                callback(e);
            }

        })();
    }


    /**
     Returns true when a valid passphrase is provided.

     @method (isPassphrase)
     @param {String} passphrase    A valid ethereum passphrase
     @return {Boolean} Whether the passphrase is valid or invalid.
     **/


    isPassphrase (passphrase) {
        if (!_.isUndefined(passphrase) && _.isString(passphrase) && !_.isEmpty(passphrase) && String(passphrase).length > this.options.minPassphraseLength) return true;
    };
}
export default Accounts;