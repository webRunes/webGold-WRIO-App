import React from 'react';
import KeyStore from '../../crypto/keystore.js';
import ExtraEntropy from './ExtraEntropy.js';
import Disclaimer from './Disclaimer.js';
import VerifyForm from './VerifyForm.js';
import {saveEthereumId} from '../../libs/apicalls.js';

const PASSPHRASE = "dummy";

export default class CreateWallet extends React.Component {

    constructor (props) {
        super(props);
        const saveEthId = (addr) => saveEthereumId("0x"+addr).then(()=> {

            window.opener.postMessage(JSON.stringify({
                "reload": true
            }), "*");
            window.close();
        }).catch((err)=>console.warn("error saving",err));
        this.state = {
            entropy: "",
            walletCode: null,
            enterEntropy: true,
            saveCB: this.props.saveCB ? this.props.saveCB : saveEthId
        };

    }


    generateSeed() {
        const entropy = this.state.entropy;
        this.randomSeed = KeyStore.generateSeed(entropy);
        console.log(this.randomSeed);
        this.setState({
            walletCode: this.randomSeed
        });
    }

    gotEntropy(e) {
        this.setState({entropy: e,enterEntropy:false});
        this.generateSeed();
    }




    render () {
        if (this.state.enterEntropy) {
            return ( <div>
                <ExtraEntropy cb={this.gotEntropy.bind(this)} />
            </div>)
        }
        if (this.state.verifyStage) {
            return (<VerifyForm callback={this.verifyCallback.bind(this)} backCallback={()=>this.setState({verifyStage: false})}/>);
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

            <div className="col-xs-12">
                <div className="pull-right">
                    <a href="#" className="btn btn-primary" onClick={() => this.setState(({ verifyStage:true}))}><span className="glyphicon glyphicon-ok"></span>Create new wallet</a>
                </div>
            </div>
        </div>);
    }
 };
