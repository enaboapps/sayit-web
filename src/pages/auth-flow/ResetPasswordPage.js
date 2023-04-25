import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { Link } from "react-router-dom";
import "./AuthFlow.css";
import BaseLayout from "../../layout/BaseLayout";

class ResetPasswordPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            error: null,
        };
    }

    handleChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value,
        });
    };

    handleSubmit = async (event) => {
        event.preventDefault();
        const { email } = this.state;
        const success = await Auth.sendPasswordResetEmail(email);
        if (success) {
            this.props.history.push("/");
        } else {
            this.setState({
                error: "Password reset failed",
            });
        }
    };

    render() {
        const { email, error } = this.state;
        return (
            <BaseLayout>
                <div className="container">
                    <h1>Reset Password</h1>
                    <form onSubmit={this.handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={email}
                                onChange={this.handleChange}
                                placeholder="Enter email"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Reset Password
                        </button>
                        {error && <p className="error">{error}</p>}
                    </form>
                    <p>
                        <Link to="/">Back to sign in</Link>
                    </p>
                </div>
            </BaseLayout>
        );
    }
}

export default ResetPasswordPage;