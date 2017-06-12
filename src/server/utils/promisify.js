/**
 * Created by michbil on 23.01.17.
 */


const promisify = (fn) => (...parameters) => new Promise ((resolve,reject) => {
    fn(...parameters,(err,res)=>{
        if (err) {
            reject(err)
        } else {
            resolve(res);
        }
    })
});

module.exports = promisify;