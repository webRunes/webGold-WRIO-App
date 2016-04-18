import React from 'react';
import Amount from './Amount';
//import CreditCard from './CreditCard';
import AddFunds from './AddFunds';
import Alert from './Alert';
//import BrainTreeForm from "./BraintreeForm"
import BincoinForm from './BitcoinForm';
import PaymentStore from '../../stores/PaymentStore';
import PaymentData from "./PaymentData";
import request from 'superagent';
import Const from '../../../../constant.js';

let SATOSHI = Const.SATOSHI;

class PaymentForm extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            alert: null,
            payment_data: null,
            amount: 0.0
        };
    }

    changeAmount(status) {
       this.setState({amount: status.amount});
    }

    componentDidMount() {
        var that = this;
        this.unsubscribe = PaymentStore.listen(function onStatusChange(status) {
            that.changeAmount(status);
        });
    }
    componentWillUnmount() {
        this.unsubscribe();
    }

    addFunds(e) {
        e.preventDefault();
        
        var form = e.target;

        /*var stripereq = {
            amount: parseFloat(form.amount.value),
            creditCard: parseFloat(form.creditCard.value),
            month: parseFloat(form.month.value),
            year: parseFloat(form.year.value),
            cvv: parseFloat(form.cvv.value)
        };*/

        request
            .post('/api/blockchain/request_payment') // '/api/stripe/add_funds'
            .send({
                amount: parseFloat(form.amount.value)*SATOSHI,
                amountWRG: parseFloat(form.amountWRG.value)
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

                var result = JSON.parse(res.text);
                this.setState({
                    payment_data: {
                        amount: result.amount,
                        adress: result.adress
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

        if (this.state.payment_data) {
            setTimeout(frameReady,600); // TODO using global function, this is wrong, make properly next time
        }

        // <form id="checkout" method="post" action="/api/braintree/payment-methods">
        // <BrainTreeForm />
        //<input type="hidden" name="amount" value={this.state.amount.USD} />
        //<input type="hidden" name="amountWRG" value={this.state.amount.WRG} />
        return (

          <form id="checkout" method="post" onSubmit={ this.addFunds.bind(this) }>
              { this.state.payment_data ? <PaymentData
                  amount= {this.state.payment_data.amount / SATOSHI}
                  adress= {this.state.payment_data.adress}
                  /> : '' }
                { this.state.alert ? 
                    <Alert 
                        type={ this.state.alert.type } 
                        message={ this.state.alert.message}
                        onClose={ this.onAlertClose.bind(this) }/> : '' }

              { this.state.payment_data ? "" :
                  <div>
                    <Amount exchangeRate={ this.props.exchangeRate } />
                    <AddFunds loginUrl={ this.props.loginUrl } />
                  </div>}
            </form>
        );
    }
}
PaymentForm.propTypes = {
    loginUrl: React.PropTypes.string.isRequired,
    exchangeRate: React.PropTypes.object
};

export default PaymentForm;