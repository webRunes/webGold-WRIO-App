import React from 'react';

class LoginButton extends React.Component {
    getLoginUrl() {
		var host = 'http://login-wrio-app-am-niceday.c9.io/';
		console.log(host);
		return host;
	}
    
    openAuthPopup() {
    	var loginUrl = this.getLoginUrl();
    	var callbackurl = window.location.protocol + '//' + window.location.host + '/callback';
    	window.open(loginUrl + 'authapi?callback=' + encodeURIComponent(callbackurl), "Login", "height=500,width=700");
	}
    
    render() {
        return (
            <button type="button" onClick={ this.openAuthPopup.bind(this) } className="btn btn-primary">
		        <span className="glyphicon glyphicon-ok"></span>Login and Donate
			</button>
        );
    }
}

export default LoginButton;