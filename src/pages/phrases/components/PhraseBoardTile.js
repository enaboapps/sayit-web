// This is a React component that will be used to display a phrase board tile
// It will contain the name of the phrase board
// It will contain the symbol of the phrase board
// You can pass in a function to be called when the user clicks on the phrase board tile
// You can pass props to this component to show that editing is enabled

import React from 'react';
import './styles/PhraseDataTile.css';

function PhraseBoardTile(props) {
    const { name, onClick, editingEnabled } = props;
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }
    return (
        <div className="phrase-data-tile" onClick={handleClick}>
            <div className="phrase-data-tile-name">{name}</div>
            {editingEnabled && (
                <div className="phrase-data-tile-edit">
                    <button className="btn btn-primary">Edit</button>
                </div>
            )}
        </div>
    );
}

export default PhraseBoardTile;