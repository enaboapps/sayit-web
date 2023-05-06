// This is a React component that will be used to display a phrase tile
// It will contain the name of the phrase
// It will contain the symbol of the phrase
// You can pass in a function to be called when the user clicks on the phrase tile
// You can pass props to this component to show that editing is enabled

import React from 'react';
import './styles/PhraseDataTile.css';

function PhraseTile(props) {
    const { text, onClick } = props;
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }
    return (
        <div className="phrase-card" onClick={handleClick}>
            <p>
                {text}
            </p>
        </div>
    );
}

export default PhraseTile;