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
            percent: 0
        };
        this.count = 0;
        this.maxcount = 128;
        this.collectionFinished = false;
    }

    componentDidMount() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }
    componentWillUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
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
            height:"150px",
            verticalAlign:"middle",
            textAlign:"center"
        };
        return (<div  className="col-sm-12">
            <div className="alert alert-warning" style={style}>
            Please, move the mouse randomly to generate a secure key for the wallet
                <div>
                    Finished {this.state.percent} %
                </div>
            </div>
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
            walletCode: null,
            enterEntropy: true,
            verifyStage: false,
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

    generateSeed() {
        const entropy = this.state.entropy;
        const passphrase = this.refs.passphrase.value;
        this.randomSeed = lightwallet.keystore.generateRandomSeed(entropy);
        console.log(this.randomSeed);
        this.setState({
            walletCode: this.randomSeed
        });
    }

    newWallet() {

        var cs = new KeyStore();
        cs.init_keystore(this.randomSeed,this.state.passphrase,() => {
            cs.newAddress(this.state.passphrase,(err,addr) => {
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


        cs.getSeed(this.state.passphrase,(seed) => {
            console.log("Extracted seed",seed);
            if (!this.props.saveCB) { // do not reload page if we in the presale mode
                parent.postMessage(JSON.stringify({
                    "reload": true
                }), "*");
            }
        });
    }


    verifyCallback(seed,pass) {
        const passphrase = this.state.passphrase;
        const wallet = this.state.walletCode;
        if (seed === wallet && passphrase === pass) {
            this.newWallet();
        } else {
            alert("Please verify that you entered everything correctly");
        }

    }

    gotEntropy(e) {
        this.setState({entropy: e,enterEntropy:false});
        this.generateSeed();
    }

    confirmPass() {
        const passphrase =  this.refs.passphrase.value;
        const passphrase2 = this.refs.passphrase2.value;

        if (passphrase !== passphrase2) {
            alert("Passwords don't match");
            return;
        }
        if (passphrase === "") {
            return alert("Password can't be blank!")
        }

        this.setState({
            verifyStage:true,
            passphrase: passphrase,
            passphrase2: passphrase2
        });

    }

    render () {
        if (this.state.enterEntropy) {
            return ( <div className="input-group">
                <ExtraEntropy cb={this.gotEntropy.bind(this)} />
            </div>)
        }
        if (this.state.verifyStage) {
            return (<VerifyForm callback={this.verifyCallback.bind(this)} backCallback={()=>this.setState({verifyStage: false})}/>)
        }
        return ( <div className="form-horizontal">
            <Disclaimer />
            <br />
            {this.state.walletCode && <div className="form-group form-inline">
                <div className="col-sm-12">
                    <div className="alert alert-warning">{this.state.walletCode}</div>
                </div>
            </div>}
            <br />
            <div className="form-group form-inline">
                <label for="id-Passphrase" className="col-sm-4 col-md-3 control-label">Passphrase</label>
                <div className="col-sm-8 col-md-9">
                    <input className="form-control" type="password" ref="passphrase"  placeholder="Enter password" size="80"></input>
                </div>
            </div>
            <div className="form-group form-inline">
                <label for="id-Passphrase" className="col-sm-4 col-md-3 control-label">Repeat passphrase</label>
                <div className="col-sm-8 col-md-9">
                    <input className="form-control" type="password" ref="passphrase2"  placeholder="Repeat your password" size="80"></input>
                </div>
            </div>
            <div className="form-group col-xs-12">
                <div className="pull-right">
                    <a href="#" className="btn btn-primary" onClick={this.confirmPass.bind(this)}><span className="glyphicon glyphicon-ok"></span>Create new wallet</a>
                </div>
            </div>
        </div>);
    }
 };

class VerifyForm extends React.Component {
    constructor(props) {
        super(props);
    }

    verify () {
        const pass = this.refs.passphrase.value;
        const seed = this.refs.seed.value.replace(/\s+/g, " "); // strip excess whitespaces
        console.log(pass,seed);
        this.props.callback(seed,pass);
    }

    goBack(e) {
        console.log("Going back",e);
        this.props.backCallback()
    }

    render () {
       return ( <div className="form-horizontal">
            <div className="callout">
                <h5>Confirmation</h5>
                <p>To confirm you've written down your seed correctly, please type it here</p>
            </div>
            <br />
            <div className="form-group form-inline">
                <label for="id-Passphrase" className="col-sm-4 col-md-3 control-label">12 word seed</label>
                <div className="col-sm-8 col-md-9">
                    <input className="form-control" ref="seed"  placeholder="Enter your 12 word seed" size="80"></input>
                </div>
            </div>
            <div className="form-group form-inline">
                <label for="id-Passphrase" className="col-sm-4 col-md-3 control-label">Passphrase</label>
                <div className="col-sm-8 col-md-9">
                    <input className="form-control" type="password" ref="passphrase"  placeholder="Enter password" size="80"></input>
                </div>
            </div>

            <div className="form-group col-xs-12">
                <a onClick={this.goBack.bind(this)} className="btn btn-default"><span className="glyphicon glyphicon-arrow-left"></span>Back</a>
                <div className="pull-right">
                    <a href="#" className="btn btn-primary" onClick={this.verify.bind(this)}><span className="glyphicon glyphicon-ok"></span>Verify</a>
                </div>
            </div>
        </div>);
    }
}