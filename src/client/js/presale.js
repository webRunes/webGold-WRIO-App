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

        this.gotEmail = this.gotEmail.bind(this)

    }

    componentWillMount() {

    }

    componentDidMount() {
        frameReady();
    }

    gotEmail(err,mail) {
        console.log(`ERR ${err} MAIL ${mail}`);
    }



    render() {
        return (
            <div>
                <div className="well">
                    WRG presale, you can buy WRG tokens using bitcoin transaction, enter your e-mail.
                </div>
                <EmailEntry gotMail={this.gotEmail} />
                <PaymentForm
                    exchangeRate={ this.state.btcExchangeRate }
                    loginUrl={ this.state.loginUrl } />
            </div>

        );
    }
}

class EmailEntry extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            email: "",
            emailCopy: "",
            emailInvalid: false,
            emailCopyInvalid: false,
            match: true
        };
        this.emailChange = this.emailChange.bind(this);
        this.emailCopyChange = this.emailCopyChange.bind(this);
    }

    validate(string) {
        let emailRegex = /.+@.+\..+/i;
        return string.match(emailRegex) === null;
    }

    compareEmails() {
        const match =  this.state.email === this.state.emailCopy;
        if (!match) {
            this.props.gotMail('Invalid mail');
        }
        this.setState({ match : match });
        if (!this.state.emailInvalid && !this.state.emailCopyInvalid) {
            return this.props.gotMail(null, this.state.email);
        }
        this.props.gotMail('Invalid mail');

    }

    emailChange(e) {
        let val = e.target.value;
        this.setState({
            email: val,
            emailInvalid: this.validate(val),
        }, ()=>this.compareEmails());

    }
    emailCopyChange(e) {
        let val = e.target.value;
        this.setState({
            emailCopy: val,
            emailCopyInvalid: this.validate(val)
        },() => this.compareEmails());

    }

    render() {
        const cls = (error) => "col-xs-4 col-sm-4 col-md-4 col-lg-3" + (error ? " has-error": "");

        return (
            <div>
                <div className={cls(this.state.emailInvalid )}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-addon">e-mail</span>
                        <input type="email" className="form-control" name="amountWRG" value={this.state.email} onChange={ this.emailChange } />
                    </div>
                    <div className="help-block">
                        {this.state.emailInvalid ? "Enter valid email" : "Enter your e-mail"}
                    </div>
                </div>

                <div className={cls(this.state.emailCopyInvalid || !this.state.match)}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-addon">e-mail</span>
                        <input type="email" className="form-control" name="amountWRG" value={this.state.emailCopy} onChange={ this.emailCopyChange } />
                    </div>
                    <div className="help-block">
                        {(this.state.match) ? "Repeat valid email" : "Emails not match"}
                    </div>
                </div>
            </div>
        );
    }
}

export function RenderPresale() {
    require('./resizeSender.js');
    ReactDOM.render(<Presale />, document.getElementById('main'));
}
