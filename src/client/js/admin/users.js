import React from 'react';
import ReactDOM from 'react-dom';
import User from './components/User';
import Info from './components/Info';
import PaymentForm from './components/PaymentForm';
import request from 'superagent';
import PaymentHistory from './components/PaymentHistory';
import EthereumClient from './components/EthereumClient';
import { Router,Route, Link } from 'react-router';
import moment from 'moment';
import {Modal,Button} from 'react-bootstrap';

import numeral from 'numeral';
let SATOSHI = 100000000;


class WRUsers extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            ethBalance: "",
            wrgBalance: ""

        };
    }

    requestStats(cb) {
        request.get('/api/webgold/coinadmin/master').end((err,balance)=> {
            if (err) {
                cb(err);
                return;
            }
            cb(null,JSON.parse(balance.text));
        });
    }

    componentWillMount() {
        var that = this;
        this.requestStats((err,state) => {
            if (err) {
                alert('Cant get stats');
                return;
            }
            that.setState(state);
        });
    }

    render() {
        return (
            <div>
                <h1>Webgold admin</h1>
                <h2>Feed account stats</h2>
                <p> Master account: { this.state.ethBalance } ETH </p>
                <p> Master account: { this.state.wrgBalance } WRG </p>
                <p> Gas price: { this.state.gasPrice } WRG </p>
            </div>

        );
    }
}
