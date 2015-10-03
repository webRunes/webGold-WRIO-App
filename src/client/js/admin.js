import React from 'react';
import User from './components/User';
import Info from './components/Info';
import PaymentForm from './components/PaymentForm';
import request from 'superagent';
import PaymentHistory from './components/PaymentHistory'
import EthereumClient from './components/EthereumClient'


class Admin extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            ethBalance: "",
            wrgBalance: "",

            data:[

            ]

        };
    }

    requestStats(cb) {
        request.get('/api/webgold/coinadmin/master').end((err,balance)=> {
            if (err) {
                cb(err);
                return;
            }
            cb(null,JSON.parse(balance.text));
        })
    }

    requestUsers(cb) {
        request.get('/api/webgold/coinadmin/users').end((err,users)=> {
            if (err) {
                cb(err);
                return;
            }
            cb(null,JSON.parse(users.text));
        })
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

        this.requestUsers((err,state) => {
            if (err) {
                alert('Cant get users');
                return;
            }
            that.setState({
                data: state
            });
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
                <h2>User's balance</h2>
                <table className="table">
                    <thead>
                    <tr>
                        <th>WRIOID</th>
                        <th>NAME</th>
                        <th>ETH ADRESS</th>
                        <th>ETH BALANCE</th>
                        <th>WRG BALANCE</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.state.data.map(function (item) {

                            return  <tr>
                                <td>{ item.wrioID }</td>
                                <td>{ item.name }</td>
                                <td>{ item.ethWallet  }</td>
                                <td>{ item.ethBalance}</td>
                                <td>{ item.wrgBalance}</td>
                            </tr>;
                        })}

                    </tbody>
                </table>
            </div>

        );
    }
}

React.render(<Admin />, document.getElementById('main'));/**
 * Created by michbil on 26.09.15.
 */
