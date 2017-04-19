/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users


import logger from 'winston';
import {db as dbMod} from '../common';var db = dbMod.db;

export default class Donations {

    constructor () {
        this.widgets = db.db.collection('webGold_Donations');
        this.record_id = null;
    }

    async create(srcWrioID,destWrioID,amount,feePaid) {
        let invoice_data = {
            srcWrioID:srcWrioID,
            destWrioID:destWrioID,
            amount: amount,
            feePaid: feePaid,
            timestamp: new Date(),
            "status": 'pending'
        };
        let invoice = await this.widgets.insertOne(invoice_data);
        this.record_id = invoice_data._id;
        return invoice_data._id;
    }

    async get(mask) {
        let data = await this.widgets.findOne(mask);
        if (!data) return null;
        this.record_id = data._id;
        return data;

    }
    async getAll(query) {
        query = query || {};
        let data = await this.widgets.find(query).sort({'timestamp':-1});
        return data.toArray();
    }

    async update (invoice_data) {
        if (this.record_id == null) {
            throw ("Invoice not defined, please use get or create method first");
        }
        await this.widgets.updateOne({_id:this.record_id },{$set: invoice_data});
    }


}