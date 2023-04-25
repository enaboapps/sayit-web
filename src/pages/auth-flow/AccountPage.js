import React from "react";
import { Link } from "react-router-dom";
import Auth from "../../business-logic/backend/Auth";
import "./AuthFlow.css";
import BaseLayout from "../../layout/BaseLayout";

class AccountPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            error: null,
        };
    }

    componentDidMount() {
        const email = Auth.getCurrentUserEmail();
        this.setState({
            email,
        });
    }

    handleSignOut = async () => {
        const success = await Auth.signOut();
        if (success) {
            this.props.history.push("/");
        } else {
            this.setState({
                error: "Sign out failed",
            });
        }
    };

    render() {
        const { email, error } = this.state;
        return (
            <BaseLayout>
                <div className="container">
                    <h1>Account</h1>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            readOnly
                            className="form-control"
                            id="email"
                            name="email"
                            value={email}
                        />
                    </div>
                    <div className="form-group">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={this.handleSignOut}
                        >
                            Sign Out
                        </button>
                    </div>
                    {error && <p className="text-danger">{error}</p>}
                </div>
            </BaseLayout>
        );
    }
}

export default AccountPage;