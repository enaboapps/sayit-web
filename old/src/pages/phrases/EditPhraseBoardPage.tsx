// This page is for editing an existing phrase board
// It will display a form for the user to edit the name of the phrase board
// Also, a button to delete the phrase board

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';
import PhraseBoard from '../../business-logic/phrases/models/PhraseBoard';
import SymbolChooser from './components/SymbolChooser';
import { Symbol } from '../../business-logic/symbols/models/Symbol';

function EditPhraseBoardPage() {
    const [phraseBoard, setPhraseBoard] = useState({} as PhraseBoard);
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState({} as Symbol | null);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const loadPhraseBoard = async () => {
            if (id) {
                await getPhraseStoreInstance().getPhraseBoard(id, (phraseBoard) => {
                    if (phraseBoard) {
                        setPhraseBoard(phraseBoard);
                        setName(phraseBoard.name);
                        setSymbol(phraseBoard.symbol);
                    }
                });
            }
        };
        loadPhraseBoard();
    }, [id]);

    const handleSubmit = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        phraseBoard.name = name;
        phraseBoard.symbol = symbol;
        const success = await getPhraseStoreInstance().updatePhraseBoard(phraseBoard);
        if (success) {
            navigate("/boards");
        } else {
            alert("Error updating phrase board");
        }
    };

    const handleDelete = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        if (id) {
            const success = await getPhraseStoreInstance().deletePhraseBoard(id);
            if (success) {
                navigate("/boards");
            } else {
                alert("Error deleting phrase board");
            }
        }
    };

    function handleDownloadAllPhrases() {
        getPhraseStoreInstance().downloadPhrases(phraseBoard.id);
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" type='submit' onClick={handleSubmit}>
                    Save
                </button>
                <div className="spacer"></div>
                <button className="btn-default" onClick={handleDownloadAllPhrases}>
                    Download All Phrases
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
                <SymbolChooser
                    symbolId={symbol?.id}
                    onSymbolChange={(symbol) => {
                        setSymbol(symbol);
                    }}
                    onSymbolRemove={() => {
                        setSymbol(null);
                    }}
                />
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default EditPhraseBoardPage;