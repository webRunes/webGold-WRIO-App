/**
 * Created by michbil on 24.01.16.
 * Local database keystore, to save encrypted keys
 */
import {db as dbMod} from '../common';var db = dbMod.db;
import logger from 'winston';

export default class mongoKeyStore {
    constructor(db) {
        this.widgets = db.collection('ethereum_accounts');
        logger.debug("===Mongo keystore init");
    }

    get(key) {
        return new Promise((resolve,reject) =>{
            this.widgets.findOne({_id:key},function (err,data) {
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
            this.widgets.insertOne({
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