import React from "react";
import { Link } from "react-router-dom";
import Auth from "../../business-logic/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import "../../global.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";

function SignInPage() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
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
        const message = await Auth.signInWithEmailAndPassword(email, password);
        if (message) {
            setError(message);
        }
    };
    return (
        <BaseLayout>
            <div className="container">
                <h1>Sign In</h1>
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
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="btn">
                        Sign In
                    </button>
                </form>
                <p>
                    Forgot your password? <Link to="/reset-password">Reset Password</Link>
                </p>
                <p>
                    Don't have an account? <Link to="/sign-up">Sign Up</Link>
                </p>
            </div>
        </BaseLayout>
    );
}

export default SignInPage;