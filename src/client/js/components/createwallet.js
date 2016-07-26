import React from 'react';
import KeyStore from '../crypto/keystore.js';
import request from 'superagent';



export default class CreateWallet extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            passphrase: "",
            passphrase2: "",
            entropy: "",
            walletCode: ""
        };
    }

    saveEthereumId(id) {
        return new Promise((resolve,reject) => {
            request.post(`/api/webgold/save_wallet?wallet=${id}`).
                set('X-Requested-With',"XMLHttpRequest").
                withCredentials().end((err,res) => {
                    if (err) {
                        return reject(res);
                    }
                    resolve(res);
                });
        });

    }

    newWallet() {
        var passphrase = this.refs.passphrase.value;
        var passphrase2 =  this.refs.passphrase2.value;
        var entropy = this.refs.entropy.value;

        if (passphrase !== passphrase2) {
            alert("Passwords shoud match");
            return;
        }

        var randomSeed = lightwallet.keystore.generateRandomSeed(entropy);
        console.log("Random seed is",randomSeed);

        var cs = new KeyStore();
        cs.init_keystore(randomSeed,passphrase,() => {
            cs.newAddress(passphrase,(addr) => {
                this.setState({
                    address: addr
                });
                window.localStorage.setItem('key',cs.keystore.serialize());
                this.saveEthereumId("0x"+addr).then(()=>window.opener.location.reload()).catch(()=>console.warn("error saving"));
            });
        });

        cs.getSeed(passphrase,(seed) => {
            this.setState({
                walletCode: seed
            });
        });

    }

    render () {

        var walletGenerated = this.state.walletCode==="";
        var form = ( <div className="input-group">
            <input className="form-control" type="text" ref="entropy" placeholder="Type random text to generate entropy" size="80"></input>
            <input className="form-control" type="text" ref="passphrase" placeholder="Type password to protect your wallet" size="80"></input>
            <input className="form-control" type="text" ref="passphrase2"  placeholder="Type again password to protect your wallet" size="80"></input>
            <button className="btn btn-default" onClick={this.newWallet.bind(this)}>Create New Wallet</button>
        </div>);

        var result = (
            <div className="well">
             <span><h2>Write down theese words, they will be essential to get access for your wallet</h2></span>
             <div>
                 <h1>{this.state.walletCode}</h1>
                 </div>
                Your address {this.state.address}
            </div>);

        return (<div>
            {walletGenerated ? form : result }
        </div>);
    }

};
