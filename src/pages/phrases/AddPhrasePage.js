// This page is for adding a new phrase to a phrase board
// It will display a form for the user to enter the phrase
// The user can click a button to add the phrase

import React, { useState } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';

function AddPhrasePage() {
    const [phrase, setPhrase] = useState("");
    const { id } = useParams();

    const navigate = useNavigate();

    function handlePhraseChange(event) {
        setPhrase(event.target.value);
    }

    async function handleAddPhrase() {
        const phraseStore = getPhraseStoreInstance();
        await phraseStore.createPhrase(id, phrase);
        navigate(`/boards/${id}/phrases`);
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={handleAddPhrase}>
                    Save
                </button>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Add Phrase</h1>
                <div className="form">
                    <div className="form-group">
                        <label htmlFor="phrase">Phrase</label>
                        <input
                            type="text"
                            id="phrase"
                            name="phrase"
                            value={phrase}
                            onChange={handlePhraseChange}
                        />
                    </div>
                </div>
            </div>
            {bottomBar()}
        </BaseLayout>
    );
}

export default AddPhrasePage;