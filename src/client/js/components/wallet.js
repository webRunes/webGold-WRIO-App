import React from 'react';
import KeyStore from '../crypto/keystore.js';
import request from 'superagent';

function parse(val) {
    var result = "Not found",
        tmp = [];
    location.search
        //.replace ( "?", "" )
        // this is better, there might be a question mark inside
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

export default class EthWallet extends React.Component {

    constructor (props) {
        super(props);
        this.tx = parse('tx');
        console.log(this.tx);

        var ksdata =  window.localStorage.getItem('key');
        this.ks = new KeyStore();
        if (ksdata) {
            this.ks.deserialize(ksdata);
            this.savedKeystore = true;
        }


    }

    sendSignedTransaction (tx) {
        request.get('/api/webgold/signtx?tx='+tx).
            set('X-Requested-With',"XMLHttpRequest").
            withCredentials().end((err,res) => {
                console.log('transaction sent');
        });
    }


    signTX(password) {
        console.log("Keystore init ok!");
        this.ks.newAddress(password,(addr) => {
            console.log(addr);
            lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
                var signed = lightwallet.signing.signTx(this.ks.keystore, pwDerivedKey, this.tx, addr);
                console.log(signed);
                this.sendSignedTransaction(signed);
            });
        });
    }


    checkCreds() {
        var seed;
        if (this.refs.seed) {
            seed = this.refs.seed.value;
        }

        var password = this.refs.password.value;

        if (this.savedKeystore) {
            return this.signTX(password);
        }

        this.ks.init_keystore(seed,password,(err) => {
            if (!err) {
                this.signTX(password);
            } else {
                console.log("Keystore init error",err);
            }

        });

    }

    render () {
        return (<div>
            <div className="input-group">
                { this.savedKeystore? "" : <input className="form-control" type="text" ref="seed" placeholder="Enter 12 word seed" size="80"></input> }
                <input className="form-control" type="text" ref="password" placeholder="Passphrase" size="80"></input>
                <button className="btn btn-default" onClick={this.checkCreds.bind(this)}>Load wallet</button>
            </div>
        </div>);
    }

}