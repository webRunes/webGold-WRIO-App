// used to track donation numbers

import logger from 'winston';
import {db as dbMod} from '../common';var db = dbMod.db;
import {utils} from '../common'; const dumpError = utils.dumpError;

export default class NonceTracker {

    constructor () {
        this.widgets = db.db.collection('webGold_noncetracker');
    }

    async create(ethID, nonce) {
        let invoice_data = {
            ethID,
            nonce,
            timestamp: new Date()
        };

        let r = await this.widgets.insertOne(invoice_data);
        return r._id;

    }

    async getSavedNonce(ethID) {
        const target = new Date(new Date - 30 * 60 *1000); // nonce will expire in 30 seconds
        try {
            const q = {
                ethID,
                timestamp: {
                    $gte: target
                }

            };
            console.log(q);
            let em =  await this.get(q);
            console.log("Found nonces",em);
            return em.nonce;
        } catch(e) {
            console.log("No nonce found in time interval");
            return -1
        }

    }

    async get(mask) {

        let data = await this.widgets.find(mask).sort({nonce : -1}).limit(1).toArray();
        if (!data) {
            throw new Error('Nonce not found');
        }
        return data[0];

    }

    async getAll() {
        return await this.get({});
    }

}