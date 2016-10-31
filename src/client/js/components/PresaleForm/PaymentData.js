import React from 'react';

class PaymentData extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log("PaymentData Mounted");
        new QRCode(document.getElementById("qrcode"), this.props.adress);
    }

    render() {
        return (
            <div className = "col-xs-12">
                <div className="col-xs-3">
                    <b>Payment data</b>
                </div>
                <div className="col-xs-6">
                  <h2>Please send <b>{this.props.amount}</b>BTC to the bitcoin adress <b>{this.props.adress}</b></h2>
                  <div id="qrcode" style= {{"margin-left": "auto","margin-right": "auto"}}></div>
                </div>
            </div>
        );
    }
}
PaymentData.propTypes = {
    adress: React.PropTypes.string,
    amount:React.PropTypes.string
};

export default PaymentData;