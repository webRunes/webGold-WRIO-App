import React from 'react';
import ReactDOM from 'react-dom';


export default class EmailEntry extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            email: "",
            emailCopy: "",
            emailInvalid: false,
            emailCopyInvalid: false,
            match: true
        };
        this.emailChange = this.emailChange.bind(this);
        this.emailCopyChange = this.emailCopyChange.bind(this);
    }

    validate(string) {
        let emailRegex = /.+@.+\..+/i;
        return string.match(emailRegex) === null;
    }

    compareEmails() {
        const match =  this.state.email === this.state.emailCopy;
        if (!match) {
            this.props.gotMail('Invalid email');
        }
        this.setState({ match : match });
        if (!this.state.emailInvalid && !this.state.emailCopyInvalid) {
            return this.props.gotMail(null, this.state.email);
        }
        this.props.gotMail('Invalid email');

    }

    emailChange(e) {
        let val = e.target.value;
        this.setState({
            email: val,
            emailInvalid: this.validate(val)
        }, ()=>this.compareEmails());

    }
    emailCopyChange(e) {
        let val = e.target.value;
        this.setState({
            emailCopy: val,
            emailCopyInvalid: this.validate(val)
        },() => this.compareEmails());

    }

    render() {
        const cls = (error) => "col-xs-4 col-sm-4 col-md-4 col-lg-3" + (error ? " has-error": "");

        return (
            <div className="col-xs-12">
                <div className="col-xs-12">
                        <div className="col-xs-3" />
                        <div className={cls(this.state.emailInvalid )}>
                            <div className="input-group input-group-sm">
                                <span className="input-group-addon">Email</span>
                                <input type="email" className="form-control" name="email" value={this.state.email} onChange={ this.emailChange } />
                            </div>
                            <div className="help-block">
                                {this.state.emailInvalid ? "Enter valid email" : "Enter your Email"}
                            </div>
                        </div>
                    </div>
                <div className="col-xs-12">
                <div className="col-xs-3" />
                <div className={cls(this.state.emailCopyInvalid || !this.state.match)}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-addon">Email</span>
                        <input type="email" className="form-control" name="emailcopy" value={this.state.emailCopy} onChange={ this.emailCopyChange } />
                    </div>
                    <div className="help-block">
                        {(this.state.match) ? "Repeat email address" : "Emails don't match"}
                    </div>
                </div>
                </div>
            </div>

        );
    }
}
