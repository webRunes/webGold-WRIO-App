import React from 'react';
import Amount from './Amount';
import CreditCard from './CreditCard';
import AddFunds from './AddFunds';
import Alert from './Alert';

import request from 'superagent';

class PaymentForm extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            alert: null
        }
    }
    
    addFunds(e) {
        e.preventDefault();
        
        var form = e.target;
        
        request
            .post('/api/stripe/add_funds')
            .send({ 
                name: 'Manny', 
                species: 'cat' })
            .end((err, res) => {
                if (err) {
                    this.setState({
                        alert: {
                            type: 'error',
                            message: 'Error: ' + err.message
                        }
                    });
                }
                
                this.setState({
                    alert: {
                        type: 'success',
                        message: res.text 
                    }
                });
            });
    }
    
    onAlertClose() {
        this.setState({
            alert: null 
        });
    }
    
    render() {
        return (
            <form id="payment-form" method="post" onSubmit={ this.addFunds.bind(this) }>
                { this.state.alert ? 
                    <Alert 
                        type={ this.state.alert.type } 
                        message={ this.state.alert.message}
                        onClose={ this.onAlertClose.bind(this) }/> : '' }
        		<Amount exchangeRate={ this.props.exchangeRate } />
                <CreditCard />
            	<AddFunds />
        	</form>
        );
    }
}

export default PaymentForm;