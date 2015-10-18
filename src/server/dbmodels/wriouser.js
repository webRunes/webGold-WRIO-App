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

    getByEthereumWallet(wallet) {
        return new Promise((resolve,reject) =>{
            this.users.findOne({ethereumWallet:wallet},function (err,data) {
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

    modifyAmount(wrioID,amount) {
        return new Promise ((resolve,reject) => {
            this.users.updateOne({wrioID:wrioID},
                {
                $inc:{
                  dbBalance:amount
                }
                },
                (err,data) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!data) {
                        return reject("User not found");
                    }
                    resolve(data);
            });
        })
    }

    /*
     This method is uses before each unit test is taken to clear db
     */

    clearTestDb() {
        return new Promise((resolve,reject) => {

              //  console.log(db);

            if (db.s.databaseName != "webrunes_test") {
                return reject("Wipe can be made only on test db");
            }
            this.users.remove({},(err) => {
                if (err)  {
                    return reject(err);
                }
                resolve("Wipe ok");
            });
            }

        );
    }

}

export default WebRunesUsers;