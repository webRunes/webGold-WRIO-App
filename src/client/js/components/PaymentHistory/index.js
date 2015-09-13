import React from 'react'
import request from 'superagent';

class PaymentsHistory extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data:[

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
                data: res.body
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
                            <td>{ item._id }</td>
                            <td>{ item.amount }</td>
                            <td>{ item.timestamp }</td>
                            <td>{ item.state}</td>
                        </tr>;
                    })}

                    </tbody>
                </table>
            </div>
        );
    }
}

export default PaymentsHistory;