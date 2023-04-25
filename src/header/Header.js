// This will always be the header of the page
// It will contain the "SayIt!" text on the left side
// It will contain the "Type", "Phrases", and "About" links on the right side
// BaseLayout.js will always contain this component

import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import Auth from '../business-logic/backend/Auth';

function Header() {
    const signedIn = Auth.isSignedIn();
    return (
        <div className="header">
            <div className="header-left">
                <h1>SayIt!</h1>
            </div>
            <div className="header-right">
                <Link to="/type">Type</Link>
                <Link to="/phrases">Phrases</Link>
                <Link to="/about">About</Link>
                {signedIn ? (
                    <Link to="/account">Account</Link>
                ) : (
                    <Link to="/sign-in">Sign In</Link>
                )}
            </div>
        </div>
    );
}

export default Header;