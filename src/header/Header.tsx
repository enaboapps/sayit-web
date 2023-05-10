// This will always be the header of the page
// It will contain the "SayIt!" text on the left side
// It will contain the "Type", "Phrases", and "About" links on the right side
// BaseLayout.js will always contain this component

import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Header.css';
import Flyout from './Flyout';
import Auth from '../business-logic/backend/Auth';

function Header() {
    const signedIn = Auth.isSignedIn();
    const closeFlyout = () => {
        const flyout = document.getElementById("flyout");
        if (!flyout) {
            return;
        }
        flyout.classList.remove("open");
    };
    return (
        <div className="header">
            <div className="header-left">
                <h1>SayIt!</h1>
            </div>
            <div className="header-right">
                <Flyout children={<MenuChildren />} onClose={closeFlyout} />
            </div>
        </div>
    );
}

function MenuChildren() {
    const signedIn = Auth.isSignedIn();
    return (
        <div className="menu-children">
            <Link to="/type">Type</Link>
            <Link to="/boards">Phrases</Link>
            <Link to="/settings">Settings</Link>
            {signedIn ? (
                <Link to="/account">Account</Link>
            ) : (
                <Link to="/sign-in">Sign In</Link>
            )}
        </div>
    );
}

export default Header;