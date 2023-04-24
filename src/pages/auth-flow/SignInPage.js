import React from "react";
import { Link } from "react-router-dom";
import Auth from "../../business-logic/backend/Auth";
import "./AuthFlow.css";

class SignInPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: "",
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
        const { email, password } = this.state;
        const success = await Auth.signInWithEmailAndPassword(email, password);
        if (success) {
            this.props.history.push("/");
        } else {
            this.setState({
                error: "Sign in failed",
            });
        }
    };

    render() {
        const { email, password, error } = this.state;
        return (
            <div className="container">
                <h1>Sign In</h1>
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
                            placeholder="Password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Sign In
                    </button>
                    {error && <p>{error.message}</p>}
                </form>
                <p>
                    Don't have an account? <Link to="/sign-up">Sign Up</Link>
                </p>
            </div>
        );
    }
}

export default SignInPage;