/**
 * WRIO user db model
 * Created by michbil on 26.09.15.
 */

import database from '../db';
let db;

class WebRunesUsers {
    constructor() {
        db = database.db;
        this.users = db.collection('webRunes_Users');
    }

    getByWrioID(wrioID) {
        return new Promise((resolve,reject) =>{
            this.users.findOne({wrioID:wrioID},function (err,data) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db user not found');
                    reject('User not found '+wrioID);
                    return;
                }
                resolve(data);
            })
        });
    }

    getAllUsers() {
        return new Promise((resolve,reject) =>{
            this.users.find({}).toArray(function (err,users) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!users) {
                    console.log('Db user not found');
                    reject('Users not found');
                    return;
                }
                resolve(users);
            })
        });
    }

    updateByWrioID(wrioID, data) {
        return new Promise((resolve,reject) =>{
            this.users.updateOne({wrioID:wrioID},{$set:data},function (err,data) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db user not found');
                    reject('User not found '+wrioID);
                    return;
                }
                resolve(data);
            })
        });
    }

    createByWrioID(wrioID, data) {
        return new Promise((resolve,reject) =>{
            this.users.updateOne({wrioID:wrioID},{$set:data},{upsert:true},function (err,data) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db user not found');
                    reject('User not found '+wrioID);
                    return;
                }
                resolve(data);
            })
        });
    }

    create(data) {
        return new Promise((resolve,reject) =>{
            this.users.insert(data,function (err,data) {
                if (err) {
                    console.log("Db user create error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db user create failed');
                    reject('User not found ');
                    return;
                }

                resolve(data.ops[0]);
            })
        });
    }

}

export default WebRunesUsers;