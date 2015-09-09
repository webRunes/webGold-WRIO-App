import React from 'react'
import request from 'superagent';

class PaymentsHistory extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data:[
                {"id":'a343af3434ff33',"amount":"0.3BTC","time":"22232",'status':"waiting payment"},
                {"id":'a343af3434ff33',"amount":"0.3BTC","time":"22232",'status':"verifying payment"},
                {"id":'a343af3434ff33',"amount":"0.3BTC","time":"22232",'status':"ok payment"}
            ]
        }

    }

    componentDidMount() {

        console.log("Mounted");
        request.post('/api/blockchain/payment_history').end((err,res) => {
           if (err || !res) {
               console.log("Can't get payment history");
               return;
           }
            this.setState({
                data: res
            })
        });


    }

    render() {
        return (
            <div>
               <h1>Pending payments</h1>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Bitcoin Adress</th>
                            <th>Amount</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        this.state.data.map(function (item) {
                        return  <tr>
                            <td>{ item.id }</td>
                            <td>{ item.amount }</td>
                            <td>{ item.time }</td>
                            <td>{ item.status}</td>
                        </tr>;
                    })}

                    </tbody>
                </table>
            </div>
        );
    }
}

export default PaymentsHistory;