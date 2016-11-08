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
            alert("Passwords don't match");
            return;
        }
        if (passphrase === "") {
            return alert("Password can't be blank!")
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
            <input className="form-control" type="password" ref="passphrase" placeholder="Enter a password to protect your wallet" size="80"></input>
            <input className="form-control" type="password" ref="passphrase2"  placeholder="Retype your password" size="80"></input>
            <button className="btn btn-default" type="button" onClick={this.newWallet.bind(this)}>Create a new wallet</button>
        </div>);

        var result = (
            <div>
                <div className="form-group">
                    <div className="callout">
                        <h5>Keep it saved!</h5>
                        <p>These 12 words are your wallet seed. It will unlock complete access to your funds even if you can't access your computer anymore. Please write them down on a piece of paper before continuing.</p>
                        <p><b>Важно:</b> мы радеем за безопасность и анонимность наших пользователей, а потому не сохраняем на серверах пароли, ключи доступа или личные данные. Невозможно украсть или изъять то, чего нет. Это защищает ваши данные и деньги от посягательств хакеров и других третьих сторон, однако помните: мы не сможем восстановить доступ к кошельку в случае потери вами указанной ниже кодовой фразы.</p>
                    </div>
                </div>
                <div className="form-group form-inline">
                    <div className="col-sm-12">
                        <div className="alert alert-warning">{this.state.walletCode}</div>
                        <div> Your address {this.state.address} </div>
                    </div>
                </div>
        </div>);

        return (<div>
            {walletGenerated ? form : result }
        </div>);
    }

};
