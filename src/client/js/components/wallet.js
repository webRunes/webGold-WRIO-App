import React from 'react';
import KeyStore from '../crypto/keystore.js';
import request from 'superagent';
import Tx from 'ethereumjs-tx';

if (window.lightwallet) {
    var txutils = lightwallet.txutils;
}

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
        window.txA = this.dbgTransaction(this.tx);
        this.state = {
            haveEthId:"pending"
        };
    }

    componentDidMount() {
        this.getEthereumId().then((id)=>{
            this.setState({
                haveEthId: true
            });
        }).catch(()=>{
            this.setState({
                haveEthId: false
            });
        });
    }

    getEthereumId() {
        return new Promise((resolve,reject) => {
            request.get('/api/webgold/get_wallet').
                set('X-Requested-With',"XMLHttpRequest").
                withCredentials().end((err,res) => {
                    if (err) {
                        return reject(res);
                    }
                   resolve(res);
                });
        });

    }

    sendSignedTransaction (tx) {
        request.get('/api/webgold/signtx?tx='+tx).
            set('X-Requested-With',"XMLHttpRequest").
            withCredentials().end((err,res) => {
                console.log('transaction sent');
        });
    }

    dbgTransaction(tx) {
        var stx = new Tx(tx);
        console.log("Validating signed   transaction....",stx.validate(),stx.verifySignature());
        console.log(stx.toJSON());
        console.log(stx);
        return stx;
    }


    signTX(password) {
        console.log("Keystore init ok!");
        this.ks.newAddress(password,(addr) => {
            console.log(addr);
           // this.sampleTransaction(addr);
            lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
                var signed = lightwallet.signing.signTx(this.ks.keystore, pwDerivedKey, this.tx, addr);
                console.log(signed);
                this.sendSignedTransaction(signed);
                this.dbgTransaction(signed);
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



    render() {

        if (this.state.haveEthId == "pending") {
            return <img src="https://wrioos.com/Default-WRIO-Theme/img/loading.gif"/>;
        }

        const openPopup = () => window.open('/create_wallet','name','width=600,height=400');

        return (
            <div>
                { this.state.haveEthId ? this.renderUnlock() :  <a href="javascript:;" target="popup" onClick={openPopup}>Please register your Ethereum wallet</a> }
            </div>
        );
    }

    renderUnlock () {
        return (<div>
            <h1> Unlock your account </h1>
            <div className="input-group">
                { this.savedKeystore? "" : <input className="form-control" type="text" ref="seed" placeholder="Enter 12 word wallet" size="80"></input> }
                <input className="form-control" type="password" ref="password" placeholder="Passphrase" size="80"></input>
                <button className="btn btn-default" onClick={this.checkCreds.bind(this)}>Load wallet</button>
            </div>
        </div>);
    }

    /*

    Sample transaction, first nonce should be '0x100000' for the testnet

     */

    sampleTransaction(addr) {
        const tx = {
            nonce: '0x100000',
            gasPrice: '0x0df8475800',
            gasLimit: '0x0651cf',
            value: '0x00',
            to: '0x61bb0b7df66ab82880c032401a5deb218f8faf3a',
            data: '0xe69d849d000000000000000000000000e8ac9e205afebc8d038116e383a63b60120b8a750000000000000000000000000000000000000000000000000000000000002af8'
        };
        this.tx = txutils.createContractTx(addr, tx).tx;
    }

}