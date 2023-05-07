// This page is for editing an existing phrase board
// It will display a form for the user to edit the name of the phrase board
// Also, a button to delete the phrase board

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';

function EditPhraseBoardPage(props) {
    const [name, setName] = useState("");
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const loadPhraseBoard = async () => {
            await getPhraseStoreInstance().getPhraseBoard(id, (phraseBoard) => {
                setName(phraseBoard.name);
            });
        };
        loadPhraseBoard();
    }, [id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const success = await getPhraseStoreInstance().updatePhraseBoard(id, name);
        if (success) {
            navigate("/boards");
        } else {
            alert("Error updating phrase board");
        }
    };

    const handleDelete = async (event) => {
        event.preventDefault();
        const success = await getPhraseStoreInstance().deletePhraseBoard(id);
        if (success) {
            navigate("/boards");
        } else {
            alert("Error deleting phrase board");
        }
    };

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" type='submit' onClick={handleSubmit}>
                    Save
                </button>
                <div className="spacer"></div>
                <button className="btn-danger" onClick={handleDelete}>
                    Delete
                </button>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Edit Phrase Board</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                </form>
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default EditPhraseBoardPage;