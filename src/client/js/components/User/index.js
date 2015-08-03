import React from 'react';
import UserInfo from './UserInfo';

class User extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <div className="form-group">
                { this.props.username ? 
                    <UserInfo username={ this.props.username } /> : '' }
                <ul className="leaders">
            	    <li>
                        <span>Current balance</span>
                        <span>
                            { this.props.balance }<small className="currency">WRG</small>
                            <sup className="currency">
                                { this.props.balance * this.props.exchangeRate / 10000 }<span className="currency">USD</span>
                            </sup>
                        </span>
                    </li>
            		<li>
        				<span>Exchange rate</span>
                        <span>
                            10 000<small className="currency">WRG</small>
                            = { this.props.exchangeRate }<small className="currency">USD</small>
                        </span>
            		</li>
            	</ul>
            </div>
        );
    }
}

export default User;