import React from 'react';
import User from './components/User';
import Info from './components/Info';
import PaymentForm from './components/PaymentForm';
import request from 'superagent';

var clientToken;

$.ajax('/api/braintree/client_token').success(function(res) {
    console.log("Got client token",res);
    clientToken = res;
    braintree.setup(clientToken, "dropin", {
        container: "payment-form"
    });
})



class App extends React.Component {


    constructor(props) {
        super(props);
        
        this.state = {
            username: null
        };
    }
    
    componentWillMount() {
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
                <PaymentForm 
                    exchangeRate={ this.state.exchangeRate } 
                    loginUrl={ this.state.loginUrl } />
            </div>

        );
    }
}

React.render(<App />, document.getElementById('main'));