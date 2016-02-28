import React from 'react';
import UserInfo from './UserInfo';
import request from 'superagent';
import BigNumber from 'bignumber.js';
import Const from '../../../../constant.js';

class User extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            balance: null
        };
        this.requestBalance((err,balance) => {
            if (balance) {
                var amount = new BigNumber(JSON.parse(balance).balance);
                console.log("Ethereum balance", amount);
                this.setState({
                    balance: amount
                });
            }
        });
    }

    requestBalance(cb) {
        request.post('/api/webgold/get_balance').end((err,balance)=> {
            if (err) {
                cb(err);
                return;
            };
            cb(null,balance.text);
        });
    }

    render() {
        var btcRate = this.props.btcExchangeRate.toFixed(8);
        var usdBalance = "...";
        var wrgBalance = "....";
        if (this.state.balance) {
            usdBalance =  this.state.balance.mul(this.props.btcExchangeRate).div(Const.WRG_UNIT).toFixed(8);
            wrgBalance = this.state.balance.toFixed(2);
        }


        return (
            <div className="form-group">
                { this.props.username ? 
                    <UserInfo username={ this.props.username } /> : '' }
                <ul className="leaders">
                    <li>
                        <span>Current balance</span>
                        <span>
                            { wrgBalance }<small className="currency">WRG</small>
                            <sup className="currency">
                                <span ref="usdBalance">{ usdBalance }</span><span className="currency">BTC</span>
                            </sup>
                        </span>
                    </li>
                    <li>
                        <span>Exchange rate</span>
                        <span>
                            1 000<small className="currency">WRG</small>
                            = { btcRate }<small className="currency">BTC</small>

                        </span>
                    </li>
                    <li>
                        <span>Exchange rate</span>
                         <span>
                            1 000<small className="currency">WRG</small>
                             = { this.props.exchangeRate }<small className="currency">USD</small>
                        </span>
                    </li>
                </ul>
            </div>
        );
    }
}

User.propTypes = {
    username: React.PropTypes.string.isRequired,
    btcExchangeRate: React.PropTypes.object,
    exchangeRate: React.PropTypes.object
};

export default User;