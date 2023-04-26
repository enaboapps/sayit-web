import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import "./AuthFlow.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";

function AccountPage() {
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    React.useEffect(() => {
        onAuthStateChanged(Auth.getAuth(), (user) => {
            if (!user) {
                navigate("/sign-in");
            }
        });
    }, []);
    if (!signedIn) {
        navigate("/sign-in");
        return null;
    }
    const signOut = async () => {
        await Auth.signOut();
    };
    return (
        <BaseLayout>
            <div className="container">
                <h1>Account</h1>
                <p>You are signed in as {Auth.getCurrentUserEmail()}</p>
                <button className="btn btn-primary" onClick={signOut}>Sign Out</button>
            </div>
        </BaseLayout>
    );
}

export default AccountPage;