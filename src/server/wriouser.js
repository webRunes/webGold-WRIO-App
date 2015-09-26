/**
 * Created by michbil on 26.09.15.
 */


class WebRunesUsers {
    constructor(db) {
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
                    reject('Keynotfound');
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
                    reject('Keynotfound');
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
                    reject('Keynotfound');
                    return;
                }
                resolve(data);
            })
        });
    }

}

export default WebRunesUsers;