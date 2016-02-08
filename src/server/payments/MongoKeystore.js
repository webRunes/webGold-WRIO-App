/**
 * Created by michbil on 24.01.16.
 */
import db from '../db';
import logger from 'winston';

export default class mongoKeyStore {
    constructor(db) {
        this.accounts = db.collection('ethereum_accounts');
    }

    get(key) {
        return new Promise((resolve,reject) =>{
            this.accounts.findOne({_id:key},function (err,data) {
                if (err) {
                    logger.error("mongoKeyStore Db key search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    logger.error('Db key not found');
                    reject('mongoKeyStore keyNotFound '+key);
                    return;
                }
                resolve(data.value);
            });
        });
    }

    set(key,value) {
        var that = this;
        return new Promise((resolve,reject) =>{
            logger.debug("Writing account to keystore");
            this.accounts.insertOne({
                "_id": key,
                "value": value

            },function(err,res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve("OK");
            });
        });
    }



}