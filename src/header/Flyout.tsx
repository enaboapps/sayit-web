// This is a flyout component that will be used to display a flyout on mobile devices

import React from 'react';
import './styles/Flyout.css';

type FlyoutProps = {
    children: React.ReactNode;
    onClose: () => void;
};

function Flyout(props: FlyoutProps) {
    const { children, onClose } = props;

    // showing variable is used to determine if the flyout is open or not
    const [showing, setShowing] = React.useState(false);

    const handleClose = () => {
        onClose();
    };

    // This function is called when the user clicks on the flyout button
    const handleFlyoutClick = () => {
        setShowing(!showing);
    };

    function items() {
        return (
            <div>
                <div className='menu-close-button-container'>
                    <button className="menu-button" onClick={handleFlyoutClick}>
                        <p>X</p>
                    </button>
                </div>
                {children}
            </div>
        );
    }

    function flyoutButton() {
        return (
            <div>
                <button className="menu-button" onClick={handleFlyoutClick}>
                    <p>Menu</p>
                </button>
            </div>
        );
    }

    return (
        <div>
            {showing ? items() : flyoutButton()}
        </div>
    );
}

export default Flyout;