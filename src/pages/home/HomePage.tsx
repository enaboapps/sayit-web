import React from "react";
import BaseLayout from "../../layout/BaseLayout";
import Auth from "../../business-logic/backend/Auth";
import { Link } from "react-router-dom";
import "../../global.css";
import './HomePage.css';
import { onAuthStateChanged } from "firebase/auth";

// This is the home page of the app. It is the first page that the user sees when they visit the app.
// If the user is signed in, they will see a welcome message and a grid of links to the other pages.
// If the user is not signed in, they will see a message telling them to sign in.

function HomePage() {
    const [signedIn, setSignedIn] = React.useState(false);
    React.useEffect(() => {
        const auth = Auth.getAuth();
        if (!auth) {
            return;
        } else {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setSignedIn(true);
                }
            });
            return unsubscribe;
        }
    }, []);
    return (
        <BaseLayout>
            <div className="container">
                <h1>Home</h1>
                {signedIn ? (
                    <>
                        <p>Welcome, {Auth.getCurrentUserEmail()}</p>
                        <div className="grid">
                            <Link to="/type" className="card">
                                <h3>Type</h3>
                                <p>Type messages</p>
                            </Link>
                            <Link to="/boards" className="card">
                                <h3>Phrases</h3>
                                <p>View and edit your phrases</p>
                            </Link>
                            <Link to="/account" className="card">
                                <h3>Account</h3>
                                <p>View your account details</p>
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p>Please <Link to="/sign-in">sign in</Link> to continue.</p>
                    </>
                )}
            </div>
        </BaseLayout>
    );
}

export default HomePage;