// This is a React component that will be used to display a phrase board tile
// It will contain the name of the phrase board
// It will contain the symbol of the phrase board
// You can pass in a function to be called when the user clicks on the phrase board tile
// You can pass props to this component to show that editing is enabled

import React from 'react';
import './styles/PhraseDataTile.css';

type PhraseBoardTileProps = {
    name: string;
    onClick?: () => void;
};

function PhraseBoardTile(props: PhraseBoardTileProps) {
    const { name, onClick } = props;
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }
    return (
        <div className="phrase-card" onClick={handleClick}>
            <p>
                {name}
            </p>
        </div>
    );
}

export default PhraseBoardTile;