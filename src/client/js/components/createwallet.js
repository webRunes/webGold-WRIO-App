import React from 'react';
import KeyStore from '../crypto/keystore.js';
import request from 'superagent';



export default class CreateWallet extends React.Component {

    constructor (props) {
        super(props);
        const saveEthId = (addr) => this.saveEthereumId("0x"+addr).then(()=>window.opener.location.reload()).catch(()=>console.warn("error saving"));
        this.state = {
            passphrase: "",
            passphrase2: "",
            entropy: "",
            walletCode: "",
            saveCB: this.props.saveCB ? this.props.saveCB : saveEthId
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
            alert("Passwords should match");
            return;
        }
        if (passphrase === "") {
            return alert("Password should not be blank!")
        }

        var randomSeed = lightwallet.keystore.generateRandomSeed(entropy);
        console.log("Random seed is",randomSeed);

        var cs = new KeyStore();
        cs.init_keystore(randomSeed,passphrase,() => {
            cs.newAddress(passphrase,(err,addr) => {
                if (err) {
                    console.warn("Unable to create new adress!");
                    return;
                }
                this.setState({
                    address: addr
                });
                window.localStorage.setItem('key',cs.keystore.serialize());
                this.state.saveCB(addr); // lets run save callback
                //this.saveEthereumId("0x"+addr).then(()=>window.opener.location.reload()).catch(()=>console.warn("error saving"));
            });
        });


        cs.getSeed(passphrase,(seed) => {
            this.setState({
                walletCode: seed
            });
            if (!this.props.saveCB) { // do not reload page if we in the presale mode
                parent.postMessage(JSON.stringify({
                    "reload": true
                }), "*");
            }
        });



    }

    render () {
        var walletGenerated = this.state.walletCode==="";
        var form = ( <div className="input-group">
            <input className="form-control" type="text" ref="entropy" placeholder="Type random text to generate entropy" size="80"></input>
            <input className="form-control" type="password" ref="passphrase" placeholder="Type password to protect your wallet" size="80"></input>
            <input className="form-control" type="password" ref="passphrase2"  placeholder="Type again password to protect your wallet" size="80"></input>
            <button className="btn btn-default" type="button" onClick={this.newWallet.bind(this)}>Create New Wallet</button>
        </div>);

        var result = (
            <div className="well">
             <span><h2>Write down theese words and your password in the safe place, they will be absolutely necessary to access your walet</h2></span>
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
