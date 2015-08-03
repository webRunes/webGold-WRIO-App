import React from 'react';

class Amount extends React.Component {
    constructor(props) {
        super(props);
        
        console.log(5 * 10000 / this.props.exchangeRate);
        this.state = {
            USD: 5,
            WRG: 5 * 10000 / this.props.exchangeRate
        };
    }
    
    componentWillReceiveProps(props) {
        this.setState({
            USD: this.state.USD,
            WRG: this.state.USD * 10000 / props.exchangeRate
        });
    }
    
    onUSDChange(e) {
        var usd = e.target.value;
        var wrg = usd * 10000 / this.props.exchangeRate;
        this.setState({
           USD: usd,
           WRG: wrg
        });
    }
    
    onWRGChange(e) {
        var wrg = e.target.value;
        var usd = wrg * this.props.exchangeRate / 10000;
        this.setState({
           USD: usd,
           WRG: wrg
        });
    }
    
    render() {
        var usd = this.state.USD;
        var wrg = this.state.WRG;
        
        return (
             <div className="form-horizontal form-group col-xs-12">
    			<div className="col-xs-12 col-sm-3 col-md-3 col-lg-2">
					<label className="col-sm-12 control-label" htmlFor="amountUSD">Amount</label>
    			</div>
    			<div className="col-xs-4 col-sm-4 col-md-4 col-lg-3">
    				<div className="input-group input-group-sm tooltip-demo">
						<span className="input-group-addon">USD</span>
						<input type="number" step="any" className="form-control" id="amount" name="amount" value={usd} onChange={ this.onUSDChange.bind(this) } min="0" />
    				</div>
    				<div className="help-block">Insufficient funds</div>
    			</div>
    			<div className="col-xs-1 col-sm-1 col-md-1 col-lg-1 align-center">
					<label className="control-label">{'='}</label>
    			</div>
    			<div className="col-xs-4 col-sm-4 col-md-4 col-lg-3">
    				<div className="input-group input-group-sm">
    					<span className="input-group-addon">WRG</span>
    					<input type="number" step="any" className="form-control" id="amountWRG" value={wrg} onChange={ this.onWRGChange.bind(this) } min="0" />
    				</div>
    				<div className="help-block">Max 99 999 WRG per day</div>
    			</div>
    		</div> 
        );
    }
}

export default Amount;