import React from 'react';
import Actions from '../../stores/PaymentActions'
import BigNumber from 'bignumber.js'

class Amount extends React.Component {
    constructor(props) {
        super(props);

        var rate = this.props.exchangeRate;
        if (!rate) {
            rate = new BigNumber(1);
        }

        this.state = {
            BTC: new BigNumber(0.1),
            WRG: (new BigNumber(10000)).mul(0.1).div(rate)
        };
        Actions.changeAmount(this.state);
    }
    
    componentWillReceiveProps(props) {

        var rate = this.props.exchangeRate;
        if (!rate) {
            rate = new BigNumber(1);
        }
        this.setState({
            BTC: this.state.BTC,
            WRG: this.state.BTC.mul(10000).div(rate)
        });
    }
    
    onBTCChange(e) {
        var BTC = new BigNumber(e.target.value.replace(",","."));
        var wrg = BTC.mul(10000).div(this.props.exchangeRate);
        var amount = {
            BTC: BTC,
            WRG: wrg
        };
        this.setState(amount);
        Actions.changeAmount(amount);
    }
    
    onWRGChange(e) {
        var wrg = new BigNumber(e.target.value.replace(",","."));
        var BTC = wrg.mul(this.props.exchangeRate).div(10000);
        var amount = {
            BTC: BTC,
            WRG: wrg
        };
        this.setState(amount);
        Actions.changeAmount(amount);
    }
    
    render() {
        var BTC = this.state.BTC.toString();
        var wrg = this.state.WRG.toFixed(2).toString();
        
        return (
             <div className="form-horizontal form-group col-xs-12">
    			<div className="col-xs-12 col-sm-3 col-md-3 col-lg-2">
					<label className="col-sm-12 control-label" htmlFor="amountBTC">Amount</label>
    			</div>
    			<div className="col-xs-4 col-sm-4 col-md-4 col-lg-3">
    				<div className="input-group input-group-sm tooltip-demo">
						<span className="input-group-addon">BTC</span>
						<input type="number" step="any" className="form-control" name="amount" value={BTC} onChange={ this.onBTCChange.bind(this) } min="0" />
    				</div>
    				
    			</div>
    			<div className="col-xs-1 col-sm-1 col-md-1 col-lg-1 align-center">
					<label className="control-label">{'='}</label>
    			</div>
    			<div className="col-xs-4 col-sm-4 col-md-4 col-lg-3">
    				<div className="input-group input-group-sm">
    					<span className="input-group-addon">WRG</span>
    					<input type="number" step="any" className="form-control" name="amountWRG" value={wrg} onChange={ this.onWRGChange.bind(this) } min="0" />
    				</div>
    				<div className="help-block">Max 99 999 WRG per day</div>
    			</div>
    		</div> 
        );
    }
}

export default Amount;