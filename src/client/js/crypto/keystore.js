

export default class KeyStore {
    constructor() {
        this.keystore = [];
    }

    deserialize(serialized) {
        this.keystore = lightwallet.keystore.deserialize(serialized);
    }

    newAddress(password,cb) {

        if (password == '') {
            password = prompt('Enter password to retrieve addresses', 'Password');
        }
        lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) =>  {
            if (err) {
                return cb(err);
            }
            this.keystore.generateNewAddress(pwDerivedKey, 1);
            var addresses = this.keystore.getAddresses();
            cb(null,addresses[0]);
        });
    }


    getSeed(password,cb) {
        lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
            var seed = this.keystore.getSeed(pwDerivedKey);
            console.log('Your seed is: "' + seed + '". Please write it down.');
            cb(seed);
        });
    }

    init_keystore(seed,password,cb) {

        lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
            if (err) {
                cb(err);
                return;
            }
            try {
                this.keystore = new lightwallet.keystore(seed, pwDerivedKey);
            } catch (e) {
                console.log(e);
                return cb("Err "+e);
            }

            console.log(this.keystore.serialize());
            cb();
        });
    }

}
