import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { Link } from "react-router-dom";
import "./AuthFlow.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";

function ResetPasswordPage() {
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState(null);
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    if (signedIn) {
        navigate("/");
        return null;
    }
    const handleSubmit = async (event) => {
        event.preventDefault();
        const message = await Auth.sendPasswordResetEmail(email);
        if (message) {
            setError(message);
        } else {
            navigate("/sign-in");
        }
    };
    return (
        <BaseLayout>
            <div className="container">
                <h1>Reset Password</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="btn btn-primary">Send Password Reset Email</button>
                </form>
                <p>
                    Don't have an account? <Link to="/sign-up">Sign Up</Link>
                </p>
            </div>
        </BaseLayout>
    );
}

export default ResetPasswordPage;