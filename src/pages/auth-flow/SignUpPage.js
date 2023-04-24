import React from "react";
import Auth from "../../business-logic/backend/Auth"
import { Link } from "react-router-dom";
import "./AuthFlow.css";

class SignUpPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: "",
            confirm_password: "",
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
        const { email, password, confirm_password } = this.state;
        if (password !== confirm_password) {
            this.setState({
                error: "Passwords do not match",
            });
            return;
        }
        if (!Auth.isPasswordStrongEnough(password)) {
            this.setState({
                error: "Password is not strong enough",
            });
            return;
        }
        const success = await Auth.signUpWithEmailAndPassword(email, password);
        if (success) {
            this.props.history.push("/");
        } else {
            this.setState({
                error: "Sign up failed",
            });
        }
    };

    render() {
        const { email, password, confirm_password, error } = this.state;
        return (
            <div className="container">
                <h1>Sign Up</h1>
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
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={password}
                            onChange={this.handleChange}
                            placeholder="Enter password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirm_password"
                            name="confirm_password"
                            value={confirm_password}
                            onChange={this.handleChange}
                            placeholder="Confirm password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Sign Up
                    </button>
                    {error && <p>{error.message}</p>}
                </form>
                <p>
                    Already have an account? <Link to="/sign-in">Sign In</Link>
                </p>
            </div>
        );
    }
}

export default SignUpPage;
