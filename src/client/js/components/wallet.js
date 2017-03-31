import React from 'react';
import KeyStore from '../crypto/keystore.js';
import Tx from 'ethereumjs-tx';
import {getEthereumId,sendSignedTransaction} from '../libs/apicalls.js';
import extractUrlParameter from '../libs/url.js';

/*

 Sample transaction, first nonce should be '0x100000' for the testnet

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
*/

let ks = new KeyStore();


export default class EthWallet extends React.Component {

    constructor (props) {
        super(props);
        this.tx = extractUrlParameter('tx');
        console.log("TX to sign",this.tx);
        if (!this.tx) throw new Error("Not tx specified!");

        window.txA = this.dbgTransaction(this.tx);
        this.state = {
            haveEthId:"pending",
            finished: false,
            error: ""
        };
    }

    componentDidMount() {
        getEthereumId().then((id)=>{
            this.setState({
                ethId:id,
                haveEthId: true
            });
        }).catch(()=>{
            this.setState({
                haveEthId: false
            });
        });
    }



    dbgTransaction(tx) {
        var stx = new Tx(tx);
        console.log("Validating signed   transaction....",stx.validate(),stx.verifySignature());
        console.log(stx.toJSON());
        console.log(stx);
        return stx;
    }

    sendSignedTransaction (tx) {
        sendSignedTransaction(tx).then((res)=>{
            this.setState({
                error: "",
                finished: true,
                txId:res.text,
                txUrl: 'https://testnet.etherscan.io/tx/'+res.text
            });
            console.log('transaction sent');
        }).catch((err)=> {
            console.log(err);
            this.setState({error: "Oops, something went wrong during transaction processing"});
        });
    }


    signTX(seed) {
        ks.extractKey(seed,'123').then(ks.signTx(this.tx)).then((signed) => {
            this.sendSignedTransaction(signed);
            this.dbgTransaction(signed);
        }).catch((err) => {
            this.setState({error: "There was trouble signing your transaction"});
            console.log(err);
        });
    }


    checkCreds() {
        let seed = this.refs.seed ? this.refs.seed.value : "";
        ks.extractKey(seed,'123').
            then(ks.verifySeedAgainstEthId(this.state.ethId)).
            then((result) => {
                if (!result) {
                    this.setState({error:"You've entered seed not matching your account"});
                } else {
                    this.signTX(seed);
                }
            }).catch(()=>{
                this.setState({error:"Keystore init error"});
                console.log("Keystore init error",err);
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
        if (this.state.finished) {
            return (<div>
                <h1>Your transaction successfully processed! Transaction hash <a href={this.state.txUrl} target="_blank">{this.state.txId}</a>></h1>
                <div><a href="javascript:history.back()">Go back</a></div>
            </div>);
        }
        return (<div>
            <h1> Unlock your account </h1>
            {this.state.error !== ""? <h5 className="breadcrumb danger">{this.state.error} </h5> : ""}
            <div className="input-group">
                { this.savedKeystore? "" : <input className="form-control" type="text" ref="seed" placeholder="Enter 12 word wallet" size="80"></input> }
                <button className="btn btn-default" onClick={this.checkCreds.bind(this)}>Load wallet</button>
            </div>

        </div>);
    }


}