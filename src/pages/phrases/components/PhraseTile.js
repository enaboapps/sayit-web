// This is a React component that will be used to display a phrase tile
// It will contain the name of the phrase
// It will contain the symbol of the phrase
// You can pass in a function to be called when the user clicks on the phrase tile
// You can pass props to this component to show that editing is enabled

import React from 'react';
import './styles/PhraseDataTile.css';

function PhraseTile(props) {
    const { name, symbol, onClick, editingEnabled } = props;
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }
    return (
        <div className="phrase-data-tile" onClick={handleClick}>
            <div className="phrase-data-tile-name">{name}</div>
            <div className="phrase-data-tile-symbol">{symbol}</div>
            {editingEnabled && (
                <div className="phrase-data-tile-edit">
                    <button className="btn btn-primary">Edit</button>
                </div>
            )}
        </div>
    );
}

export default PhraseTile;