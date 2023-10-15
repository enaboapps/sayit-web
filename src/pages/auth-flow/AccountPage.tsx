import React from "react";
import Auth from "../../business-logic/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import "../../global.css";
import BaseLayout from "../../layout/BaseLayout";
import { useNavigate } from "react-router-dom";
import getPurchaseManager from "../../business-logic/payments/PurchaseManager";

function AccountPage() {
    const navigate = useNavigate();
    const signedIn = Auth.isSignedIn();
    const [showingUpgrade, setShowingUpgrade] = React.useState(false);
    const [sub, setSub] = React.useState(false);
    React.useEffect(() => {
        const auth = Auth.getAuth();
        if (!auth) {
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/sign-in");
                return;
            }
        });
        async function checkPro() {
            const pro = await getPurchaseManager().isPro();
            setShowingUpgrade(!pro);
        }
        checkPro();
        async function checkSub() {
            const sub = await getPurchaseManager().isSubscriber();
            setSub(sub);
        }
        checkSub();
    }, []);
    if (!signedIn) {
        navigate("/sign-in");
        return null;
    }
    const signOut = async () => {
        await Auth.signOut();
    };
    const goToCustomerPortal = async () => {
        await getPurchaseManager().goToCustomerPortal();
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
                        <p>Upgrade to Pro to get access to unlimited Phrase Boards and Phrases</p>
                        <button className="btn-default" onClick={() => navigate("/paywall")}>Upgrade</button>
                    </div>
                )}
                {sub && (
                    <div>
                        <h2>Subscription</h2>
                        <p>You are subscribed to SayIt! Pro</p>
                        <button className="btn-default" onClick={goToCustomerPortal}>Manage Subscription</button>
                    </div>
                )}
            </div>
        </BaseLayout>
    );
}

export default AccountPage;