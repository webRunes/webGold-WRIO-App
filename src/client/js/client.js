import React from 'react';
import User from './components/User';
import Info from './components/Info';
import PaymentForm from './components/PaymentForm';
import request from 'superagent';
import PaymentHistory from './components/PaymentHistory'

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
    return "http://"+host+'/';

}


class App extends React.Component {


    constructor(props) {
        super(props);
        
        this.state = {
            username: null,
            exchangeRate: 10

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
                
                this.setState(res.body);
            });
    }
    
    render() {
        return (
            <div>
                { this.state.username ?
                    <User 
                        username={ this.state.username } 
                        balance={ this.state.balance } 
                        exchangeRate={ this.state.exchangeRate }/> : '' }
                <Info />
                <PaymentHistory />
                <PaymentForm 
                    exchangeRate={ this.state.exchangeRate } 
                    loginUrl={ this.state.loginUrl } />
            </div>

        );
    }
}

React.render(<App />, document.getElementById('main'));