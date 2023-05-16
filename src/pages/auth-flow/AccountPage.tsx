import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import "../../global.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";
import PaymentRecorder from "../../business-logic/payments/PaymentRecorder";

function AccountPage() {
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    const [showingUpgrade, setShowingUpgrade] = React.useState(false);
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
        async function checkPro() {
            const pro = await PaymentRecorder.isPro();
            setShowingUpgrade(!pro);
        }
        checkPro();
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
                {showingUpgrade && (
                    <div>
                        <h2>Upgrade to Pro</h2>
                        <p>Upgrade to Pro to get access to AI integration and unlimited Phrase Boards and Phrases</p>
                        <button className="btn-default" onClick={() => navigate("/paywall")}>Upgrade</button>
                    </div>
                )}
            </div>
        </BaseLayout>
    );
}

export default AccountPage;