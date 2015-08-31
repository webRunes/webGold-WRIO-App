import React from 'react';
import Amount from './Amount';
import CreditCard from './CreditCard';
import AddFunds from './AddFunds';
import Alert from './Alert';
import BrainTreeForm from "./BraintreeForm"
import PaymentStore from '../../stores/PaymentStore'
import request from 'superagent';

class PaymentForm extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            alert: null,
            amount: 0.0
        }
    }

    changeAmount(status) {
       this.setState({amount: status.amount});
    }

    componentDidMount() {
        var that = this;
        this.unsubscribe = PaymentStore.listen(function onStatusChange(status) {
            that.changeAmount(status)
        });
    }
    componentWillUnmount() {
        this.unsubscribe();
    }

    addFunds(e) {
        e.preventDefault();
        
        var form = e.target;
        
        request
            .post('/api/stripe/add_funds')
            .send({ 
                amount: parseFloat(form.amount.value),
                creditCard: parseFloat(form.creditCard.value),
                month: parseFloat(form.month.value),
                year: parseFloat(form.year.value),
                cvv: parseFloat(form.cvv.value)
            })
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
          <form id="checkout" method="post" action="/api/braintree/payment-methods">
              <input type="hidden" name="amount" value={this.state.amount.USD} />
              <input type="hidden" name="amountWRG" value={this.state.amount.WRG} />
                { this.state.alert ? 
                    <Alert 
                        type={ this.state.alert.type } 
                        message={ this.state.alert.message}
                        onClose={ this.onAlertClose.bind(this) }/> : '' }
        		<Amount exchangeRate={ this.props.exchangeRate } />
                <BrainTreeForm />
            	<AddFunds loginUrl={ this.props.loginUrl } />
        	</form>
        );
    }
}

export default PaymentForm;