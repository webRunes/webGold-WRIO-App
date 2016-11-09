import React from 'react';
import KeyStore from '../crypto/keystore.js';
import request from 'superagent';


export class Disclaimer extends React.Component {
    render() {
        return (
            <div className="callout">
                <h5>Keep it safe!</h5>
                <p>These 12 words are your wallet seed. It will unlock complete access to your funds even if you can't access your computer anymore. Please write them down on a piece of paper before continuing.</p>
                <p><b>Важно:</b> мы радеем за безопасность и анонимность наших пользователей, а потому не сохраняем на серверах пароли, ключи доступа или личные данные. Невозможно украсть или изъять то, чего нет. Это защищает ваши данные и деньги от посягательств хакеров и других третьих сторон, однако помните: мы не сможем восстановить доступ к кошельку в случае потери вами указанной ниже кодовой фразы.</p>
            </div>);
    }
}

class ExtraEntropy extends React.Component {

    constructor(props) {
        super(props);
        this.s = "";
        this.state = {
            percent: 0,
        };
        this.count = 0;
        this.maxcount = 1000;
        this.collectionFinished = false;
    }

    componentDidMount() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onMouseMove(e) {
        const t = new Date().getTime();
        const s = ""+e.pageX+":"+e.pageY+"T:"+t;
        this.s = this.s+s;
        this.count++;
        let percent = Math.floor(100*(this.count / this.maxcount));
        if (percent > 100) {
            return;
        }
        this.setState({percent:percent});

        if (!this.collectionFinished && this.count > this.maxcount) {
            this.props.cb(this.s);
            this.collectionFinished = true;
        }
    }

    render() {
        const style = {
            backgroundColor: "blue",
            width: "100%",
            height:"180px",
            verticalAlign:"middle",
            textAlign:"center"
        };
        return (<div style={style}>
            Move mouse over this field. Finished {this.state.percent} %
        </div>)
    }
}

export default class CreateWallet extends React.Component {

    constructor (props) {
        super(props);
        const saveEthId = (addr) => this.saveEthereumId("0x"+addr).then(()=>window.opener.location.reload()).catch(()=>console.warn("error saving"));
        this.state = {
            passphrase: "",
            passphrase2: "",
            entropy: "",
            walletCode: "",
            enterEntropy: true,
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
        var entropy = this.state.entropy;

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

        if (this.state.enterEntropy) {
            return ( <div className="input-group">
                <Disclaimer />
                <ExtraEntropy cb={(e) => this.setState({entropy: e,enterEntropy:false})} />
            </div>)
        }

        var form = ( <div className="input-group">
            <Disclaimer />
            <input className="form-control" type="password" ref="passphrase" placeholder="Enter a password to protect your wallet" size="80"></input>
            <input className="form-control" type="password" ref="passphrase2"  placeholder="Retype your password" size="80"></input>
            <button className="btn btn-default" type="button" onClick={this.newWallet.bind(this)}>Create a new wallet</button>
        </div>);

        var result = (
            <div>
                <div className="form-group">
                   <Disclaimer />
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
