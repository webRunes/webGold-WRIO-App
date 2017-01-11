/**
 *
 * * Created by michbil on 26.09.15.
 *
 * This file is based on https://github.com/SilentCicero/ethereumjs-accounts and adaped for our needs

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


import logger from 'winston';
import {isAddress,isBigNumber,randomBytes,formatAddress,formatNumber,formatHex} from './utils.js';
import _ from 'underscore';
import Tx from 'ethereumjs-tx';
import BigNumber from 'bignumber.js';
import JSZip from "jszip";
import crypto from 'crypto';
import ethUtil from 'ethereumjs-util';
import CryptoJS from 'crypto-js';



import Web3 from 'web3'; var web3 = new Web3();
import {utils} from '../../common'; const dumpError = utils.dumpError;


class KeyStoreClass {
    constructor() {
        this.keys = {};
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


var KeyStore = new KeyStoreClass();


class Accounts {


    constructor (options) {
        this.unlockedAccounts = {};
        if (_.isUndefined(options)) {
            options = {};
        }

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
        logger.debug("NEW:",privateKey.toString('hex'),publicKey.toString('hex'),accountObject);
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

                var hash = ethUtil.sha3(accountObject['public'] + accountObject['private']).toString('hex');

                if (hash == accountObject.hash) {
                    accountObject.locked = false;
                }
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

    if(!this.contains(address)) {
        return;
    }


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
        logger.debug(text);
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
     *
     * @param rawTX
     * @param from
     * @returns {*}
     */

    async signRawTx(rawTx,from) {
        var account = await this.get(from);
        if (account.encrypted) {
            logger.debug("Trying to decrypt account....");
            account = await this.get(from, this.getAccountPassphrase(account));
        }

        // if account is still locked, quit
        if (account.locked) {
            logger.error("Still locked, can't decrypt account");
            throw new Error("Cannot sign transaction. Account locked!");
            return;
        }

        var privateKey = new Buffer(account['private'], 'hex');
        logger.debug(rawTx);
        // init new transaction object, and sign the transaction
        var tx = new Tx(rawTx);
        tx.sign(privateKey);
        var serializedTx = '0x' + tx.serialize().toString('hex');
        return  serializedTx;
    }

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
        (async () => { // async function wrapper
            try {
                logger.debug("Signing transaction",tx_params);
                // Get the account of address set in sendTransaction options, from the accounts stored in browser
                var account = await this.get(tx_params.from);

                // if the account is encrypted, try to decrypt it
                if (account.encrypted) {
                    logger.debug("Trying to decrypt account....");
                    account = await this.get(tx_params.from, this.getAccountPassphrase(account));
                }

                // if account is still locked, quit
                if (account.locked) {
                    logger.error("Still locked, can't decrypt account");
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
                    value: '0x00',
                    data: ''
                };

                console.log(rawTx);

                if (tx_params.gasPrice != null) {rawTx.gasPrice = formatHex(ethUtil.stripHexPrefix(tx_params.gasPrice));}
                if (tx_params.gas != null) {rawTx.gasLimit = formatHex(ethUtil.stripHexPrefix(tx_params.gas));}
                if (tx_params.to != null) {rawTx.to = formatHex(ethUtil.stripHexPrefix(tx_params.to));}
                if (tx_params.value != null) {rawTx.value = formatHex(ethUtil.stripHexPrefix(tx_params.value));}
                if (tx_params.data != null) {rawTx.data = formatHex(ethUtil.stripHexPrefix(tx_params.data));}
                // convert string private key to a Buffer Object
                var privateKey = new Buffer(account['private'], 'hex');

                logger.debug(rawTx);

                // init new transaction object, and sign the transaction
                var tx = new Tx(rawTx);
                tx.sign(privateKey);

                //logger.debug(tx);
                //logger.debug(tx.getUpfrontCost());
                // Build a serialized hex version of the Tx
                var serializedTx = '0x' + tx.serialize().toString('hex');

                callback(null, serializedTx);
            } catch (e) {
                logger.error("Error during signtransaction",e);
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