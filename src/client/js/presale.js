import React from 'react';
import ReactDOM from 'react-dom';
import User from './components/User';
import Info from './components/Info';
import PaymentForm from './components/PaymentForm';
import request from 'superagent';
import PaymentHistory from './components/PaymentHistory';
import EthereumClient from './components/EthereumClient';
import BigNumber from 'bignumber.js';
import Const from '../../constant.js';
import EthWallet from './components/wallet.js';
import CreateWallet from './components/createwallet.js';


let SATOSHI = Const.SATOSHI;

function getLoginUrl() {

    var host = window.location.host;
    host = host.replace('webgold.','login.');
    return "//"+host+'/';
}


class Presale extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: null,
            exchangeRate: 10,
            showpending: false,
            loginUrl: getLoginUrl(),
            btcExchangeRate: new BigNumber(0.0333333333)
        };
    }

    componentWillMount() {

    }

    componentDidMount() {
        frameReady();
    }

    render() {
        return (
            <div>
                <div className="well">
                    WRG presale, you can buy WRG tokens using bitcoin transaction, enter your e-mail.
                </div>

                <PaymentForm
                    exchangeRate={ this.state.btcExchangeRate }
                    loginUrl={ this.state.loginUrl } />
            </div>

        );
    }
}


export function RenderPresale() {
    require('./resizeSender.js');
    ReactDOM.render(<Presale />, document.getElementById('main'));
}
