import React from 'react';
import ReactDOM from 'react-dom';
import User from './components/User';
import Info from './components/Info';
import moment from 'moment'
import {Modal,Button} from 'react-bootstrap'
import Actions from './actions/transactions.js'
import BigNumber from 'bignumber.js'
import UnitConverter from './libs/units.js'

import TransactionStore from './stores/TransactionStore.js'
import BalanceStore from './stores/BalanceStore.js'

import numeral from 'numeral';
let SATOSHI = 100000000;

class Transactions extends React.Component {

    constructor(props) {
        console.log("Balances created");
        super(props);

        this.state = {
            data: [],
            modalContent: null,
            loading: true
        };
    }

    componentWillMount() {

        TransactionStore.listen((transactions) => {
            if (transactions.error) {
                this.setState({
                    error:transactions.error,
                    loading: false
                });
                return;
            }
            this.setState({
                data: transactions,
                loading: false
            });

        });

        Actions.Rate.listen((val)=>{
            this.setState({
                rates: val
            })
        });
        Actions.Balance.listen((val)=> {
            this.setState({
                balance: val
            })
        })

    }

    render() {


        var usdBalance = "...";
        var wrgBalance = "...";
        var exchangeRate = "...";
        if (this.state.balance && this.state.rates) {
            this.exchange = new UnitConverter(this.state.rates);
            usdBalance =  (this.exchange.wrgToUsd(this.state.balance)).toFixed(2);
            wrgBalance = this.state.balance.toFixed(2);
        }
        if (this.state.rates) {
            exchangeRate =  this.state.rates.exchangeRate;
        }

       var table = (
            <table className="table table-striped table-hover">
                <thead>
                <tr>
                    <th></th>
                    <th>Transaction</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                </tr>
                </thead>
                <tbody>

                {
                    this.state.data.map(function (item) {
                        var title = "";
                        var glyph = "";
                        var status = "";
                        var opacity = 1.0;

                        if (item.type === "add_funds") {
                            glyph = "glyphicon glyphicon-arrow-down";
                            title = "Funds added";
                            if (item.state == "request_sent") {
                                status = "Awaiting payment";
                                opacity = 0.4;
                                title = "Funds add requested";
                            }
                            if (item.state == "payment_confirmed") {
                                status = "Payment confirmed"
                            }
                        }
                        if (item.type === "donation") {
                            if (item.incoming) {
                                glyph = "glyphicon glyphicon-arrow-down";
                                title = "Received donation from @" + item.srcName;
                            } else {
                                glyph = "glyphicon glyphicon-arrow-up";
                                title = "Sent donation to @" + item.destName;
                                item.amount = -item.amount;
                            }
                            status = "Completed";
                        }

                        if (item.type === "prepayment") {
                            opacity = 0.6;
                            if (item.incoming) {
                                glyph = "glyphicon glyphicon-arrow-down";
                                title = "Received donation from @" + item.srcName;
                            } else {
                                glyph = "glyphicon glyphicon-arrow-up";
                                title = "Sent donation to @" + item.destName;
                                item.amount = -item.amount;
                            }
                            status = "Pending";

                        }

                        var style = {opacity: opacity};

                        return (
                            <tr key={item.id} style={ style }>
                                <td><span className={ glyph }></span></td>
                                <td>{title}</td>
                                <td>{new Date(item.timestamp).toDateString()}</td>
                                <td>{status}</td>
                                <td>{item.amount}
                                    <small className="currency">WRG</small>
                                    <sup className="currency">{item.amountUSD} USD</sup>
                                </td>
                            </tr>
                        );
                    })
                }

                </tbody>
            </table>);

        var showtable = false;
        var nomsg = "";

        if (this.state.loading) {
            showtable = false;

        } else {
            if (this.state.data == []) {
                showtable = false;
                nomsg = "No records"
            } else {
                showtable = "true";
                nomsg = "";
            }
        }
        var loader = (<img src="http://wrioos.com.s3.amazonaws.com/Default-WRIO-Theme/img/loading.gif"/>);

        if (this.state.error) {
            nomsg = this.state.error;
            showtable = false;
        }

        return (
            <div>
                <ul className="breadcrumb">
                    <li className="active">Transactions</li>
                </ul>
                <ul className="leaders">
                    <li><span>Current Balance&nbsp;</span>
                        <span>&nbsp; { wrgBalance }
                            <small className="currency">WRG</small><sup className="currency">{ usdBalance } USD</sup></span></li>
                    <li><span>Exchange Rate&nbsp;</span>
                        <span>&nbsp;10000
                            <small className="currency">WRG</small>
                            =&nbsp;{ exchangeRate }
                            <small className="currency">USD</small></span></li>
                </ul>
                {this.state.loading?loader:""}
                {showtable?table:<div className="alert alert-warning">{nomsg}</div>}

            </div>
        );
    }
}


//console.log(Router,Route);
ReactDOM.render((<Transactions />), document.getElementById('transactionsholder'));

