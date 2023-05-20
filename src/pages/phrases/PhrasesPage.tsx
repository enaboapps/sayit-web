// This page displays phrases from a phrase board in a grid
// It will display the phrases in a grid
// The user can click on a phrase to hear it spoken

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import PhraseDataGrid from './components/PhraseDataGrid';
import PhraseTile from './components/PhraseTile';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';
import '../../global.css';
import getSpeechServiceInstance from '../../speech/SpeechService';
import Phrase from '../../business-logic/phrases/models/Phrase';

function PhrasesPage() {
    const [phrases, setPhrases] = useState([] as Phrase[]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editable, setEditable] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        async function fetchData() {
            if (id) {
                await getPhraseStoreInstance().getPhrases(id, (phrases) => {
                    if (phrases) {
                        setPhrases(phrases);
                        setLoading(false);
                        setEditable(phrases.length > 0);
                    }
                });
            }
        }
        fetchData();
    }, [id]);

    const navigate = useNavigate();

    async function handlePhraseClick(phrase: Phrase) {
        if (editing) {
            navigate(`/boards/${id}/phrases/edit/${phrase.id}`);
        } else {
            const speechService = getSpeechServiceInstance();
            await speechService.speak(phrase.text);
        }
    }

    function openAddPhrasePage() {
        navigate(`/boards/${id}/phrases/add`);
    }

    // Top bar with the title and the back button
    function topBar() {
        return (
            <div className="top-bar">
                <button className="btn-default" onClick={() => navigate("/boards")}>
                    Back
                </button>
                <h1>Phrases</h1>
            </div>
        );
    }

    function editingBanner() {
        return (
            <div className="editing-banner">
                <p>Click on a phrase to edit it</p>
            </div>
        );
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={openAddPhrasePage}>
                    Add Phrase
                </button>
                <div className="spacer"></div>
                {editable && (
                    <button className="btn-default" onClick={() => setEditing(!editing)}>
                        {editing ? "Done" : "Edit"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                {topBar()}
                {loading && <p>Loading...</p>}
                {!loading && (
                    <PhraseDataGrid
                        data={phrases}
                        itemsPerPage={9}
                        renderItem={(phrase) => (
                            <PhraseTile
                                text={phrase.text}
                                onClick={() => handlePhraseClick(phrase)}
                            />
                        )}
                    />
                )}
                {editing && editingBanner()}
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default PhrasesPage;