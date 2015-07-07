import {MongoClient} from 'mongodb';
import nconf from './wrio_nconf'; 

let db;

export function init() {
    let host = nconf.get('db:host');
    let user = nconf.get('db:mongouser');
    let password = nconf.get('db:password');
    let mongodbname = nconf.get('db:mongodbname');    
    
    let url = `mongodb://${user}:${password}@${host}:27017/${mongodbname}`;
    
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function(err, database) {
            if (err) {
                return reject(err);  
            }
            
            db = database;
            resolve(db);
        });
    });
}

export default db;