import React from 'react';
import UserInfo from './UserInfo';
import request from 'superagent';

class User extends React.Component {
    constructor(props) {
        super(props);
        var that = this;
        this.state = {
            balance: "..."
        }
        this.requestBalance((err,balance) => {
            var amount = JSON.parse(balance).ballance;
            console.log("Ethereum ballance", amount);
            that.setState({
                balance: amount
                });
        });
    }

    requestBalance(cb) {
        request.post('/api/webgold/get_ballance').end((err,balance)=> {
            if (err) {
                cb(err);
                return;
            }
            cb(null,balance.text);
        })
    }

    render() {
        return (
            <div className="form-group">
                { this.props.username ? 
                    <UserInfo username={ this.props.username } /> : '' }
                <ul className="leaders">
            	    <li>
                        <span>Current balance</span>
                        <span>
                            { this.state.balance }<small className="currency">WRG</small>
                            <sup className="currency">
                                { this.state.balance * this.props.btcExchangeRate / 10000 }<span className="currency">BTC</span>
                            </sup>
                        </span>
                    </li>
            		<li>
        				<span>Exchange rate</span>
                        <span>
                            10 000<small className="currency">WRG</small>
                            = { this.props.btcExchangeRate }<small className="currency">BTC</small>

                        </span>
            		</li>
                    <li>
                        <span>Exchange rate</span>
                         <span>
                            10 000<small className="currency">WRG</small>
                             = { this.props.exchangeRate }<small className="currency">USD</small>
                        </span>
                    </li>
            	</ul>
            </div>
        );
    }
}

export default User;