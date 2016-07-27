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

/*

 *** braintree code commented

 var clientToken;

 request.
 get('/api/braintree/client_token').
 end(function (err,res) {
 if (err) {
 console.log("Can't get braintree client token, aborting");
 return;
 }
 console.log("Got braintree client token");
 clientToken = res.text;
 braintree.setup(clientToken, "dropin", {
 container: "payment-form"
 });
 });
 */

function getLoginUrl() {

    var host = window.location.host;
    host = host.replace('webgold.','login.');
    return "//"+host+'/';

}


class App extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            username: null,
            exchangeRate: 10,
            showpending: false

        };
    }


    componentWillMount() {
        this.state.loginUrl = getLoginUrl();
        request
            .get('/add_funds_data')
            .end((err, res) => {
                if (err) {
                    return console.log('Error:', err.message);
                }

                this.setState({
                    username: res.body.username,
                    loginUrl: res.body.loginUrl,
                    balance: res.body.balance,
                    exchangeRate: res.body.exchangeRate,
                    btcExchangeRate: new BigNumber(res.body.btcExchangeRate).div(SATOSHI)
                });
                console.log("BTC exchange rate", this.state.btcExchangeRate.toString());
                console.log("USD exchange rate", this.state.exchangeRate );
                frameReady();
            });
    }

    componentDidMount() {
        frameReady();
    }

    render() {

        var that = this;

        function expand() {
            that.setState({showpending: !that.state.showpending});
        }
        return (
            <div>
                { this.state.username ?
                    <User
                        username={ this.state.username }
                        balance={ this.state.balance }
                        btcExchangeRate={ this.state.btcExchangeRate  }
                        exchangeRate={ this.state.exchangeRate  }/> : '' }
                <Info />


                <PaymentForm
                    exchangeRate={ this.state.btcExchangeRate }
                    loginUrl={ this.state.loginUrl } />

                <a href="javascript:;" onClick={expand}>See pending payments</a>
                { this.state.showpending ? <PaymentHistory /> : "" }

            </div>

        );
    }
}

(function() {
    var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
            requestAnimationFrame(function() {
                // For IE compatibility
                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(name, false, false, {
                    'cmd': "resize"
                });
                obj.dispatchEvent(evt);
                // obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    /* init - you can init any event */
    throttle("resize", "optimizedResize");
})();

export function RenderAddFunds() {

// handle event
    window.addEventListener("optimizedResize", function() {
        frameReady();
    });

    window.frameReady = function() {
        var ht = $("#main").height();
        console.log("Webgold height",ht);
        parent.postMessage(JSON.stringify({"webgoldHeight":ht}), "*"); // signal that iframe is renered and ready to go, so we can calculate it's actual height now
        return true;
    };



    ReactDOM.render(<App />, document.getElementById('main'));
}
