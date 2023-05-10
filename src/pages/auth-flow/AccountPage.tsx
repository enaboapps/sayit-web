import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import "../../global.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";

function AccountPage() {
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    React.useEffect(() => {
        const auth = Auth.getAuth();
        if (!auth) {
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
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
                <button className="btn-default" onClick={signOut}>Sign Out</button>
            </div>
        </BaseLayout>
    );
}

export default AccountPage;