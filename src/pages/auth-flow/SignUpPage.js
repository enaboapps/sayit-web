import React from "react";
import Auth from "../../business-logic/backend/Auth"
import { Link } from "react-router-dom";
import "./AuthFlow.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

function SignUpPage() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [error, setError] = React.useState(null);
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    React.useEffect(() => {
        onAuthStateChanged(Auth.getAuth(), (user) => {
            if (user) {
                navigate("/");
            }
        });
    }, []);
    if (signedIn) {
        navigate("/");
        return null;
    }
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!Auth.isPasswordStrongEnough(password)) {
            setError("Password is not strong enough");
        }
        const message = await Auth.createUserWithEmailAndPassword(email, password);
        if (message) {
            setError(message);
        }
    };
    return (
        <BaseLayout>
            <div className="container">
                <h1>Sign Up</h1>
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
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="btn btn-primary">Sign Up</button>
                </form>
                <p>Already have an account? <Link to="/sign-in">Sign In</Link></p>
            </div>
        </BaseLayout>
    );
}

export default SignUpPage;
