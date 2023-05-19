// This popover will be used to save a phrase
// It will show a select box to select the phrase board to save the phrase to

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import '../../global.css';
import PhraseBoard from '../../business-logic/phrases/models/PhraseBoard';

type SavePhrasePopoverProps = {
    phrase: string;
    onClosed: () => void;
};

function SavePhrasePopover(props: SavePhrasePopoverProps) {
    const { phrase, onClosed } = props;
    const [phraseBoards, setPhraseBoards] = useState([] as PhraseBoard[]);
    const [selectedPhraseBoard, setSelectedPhraseBoard] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchData() {
            await getPhraseStoreInstance().getAllPhraseBoards((phraseBoards) => {
                if (phraseBoards) {
                    setPhraseBoards(phraseBoards);
                }
            });
        }
        fetchData();
    }, []);

    function handlePhraseBoardChange(event: { target: { value: React.SetStateAction<string>; }; }) {
        setSelectedPhraseBoard(event.target.value);
    }

    async function handleSavePhrase() {
        if (!selectedPhraseBoard) {
            return;
        }
        setIsSaving(true);
        await getPhraseStoreInstance().createPhrase(selectedPhraseBoard, phrase);
        setIsSaving(false);
        onClosed();
    }

    function bottomBar() {
        return (
            <button className="btn-default" onClick={handleSavePhrase}>
                Save
            </button>
        );
    }

    return (
        <div className="popover-content">
            <h1>Save Phrase</h1>
            {isSaving && <p>Saving...</p>}
            <div className="form">
                <div className="form-group">
                    <label>Phrase Board</label>
                    <select
                        value={selectedPhraseBoard}
                        onChange={handlePhraseBoardChange}
                    >
                        <option value="">Select a phrase board</option>
                        {phraseBoards.map((phraseBoard) => (
                            <option key={phraseBoard.id} value={phraseBoard.id}>
                                {phraseBoard.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {bottomBar()}
        </div>
    );
}

export default SavePhrasePopover;