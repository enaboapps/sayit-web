// This view allows the user to type what they want to say
// It will contain the text that the user is typing in a text area
// It will contain buttons to speak the text and clear the text
// It will contain a button to save the text as a phrase

import React from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import './TypingPage.css';
import getSpeechServiceInstance from '../../speech/SpeechService';
import SavePhrasePopover from './SavePhrasePopover';
import { Popover, CircularProgress } from '@mui/material';
import AI from '../../business-logic/ai/AI';

function TypingPage() {
    const [text, setText] = React.useState("");
    const [showingAddPhrase, setShowingAddPhrase] = React.useState(false);
    const [aiInProgress, setAIInProgress] = React.useState(false);

    const handleTextChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setText(event.target.value);
    }

    const handleClearText = () => {
        setText("");
    }

    const handleSaveText = () => {
        setShowingAddPhrase(true);
    }

    const handleSpeakText = () => {
        getSpeechServiceInstance().speak(text);
    }

    const handleAskAI = async () => {
        setAIInProgress(true);
        const ai = new AI();
        const response = await ai.ask(text);
        setText(response);
        setAIInProgress(false);
    }

    const handleFillInGaps = async () => {
        setAIInProgress(true);
        const ai = new AI();
        const response = await ai.fillInGaps(text);
        setText(response);
        setAIInProgress(false);
    }

    const handleFleshOutMessage = async () => {
        setAIInProgress(true);
        const ai = new AI();
        const response = await ai.fleshOut(text);
        setText(response);
        setAIInProgress(false);
    }

    return (
        <BaseLayout>
            <div className="container">
                <textarea className="text-area" value={text} onChange={handleTextChange} />
                {text.length > 0 && (
                    <div className="button-container-wrapper">
                        <div className="button-container">
                            <button className="btn-default" onClick={handleSpeakText} disabled={aiInProgress}>
                                Speak
                            </button>
                            <button className="btn-default" onClick={handleClearText} disabled={aiInProgress}>
                                Clear
                            </button>
                            <button className="btn-default" onClick={handleSaveText} disabled={aiInProgress}>
                                Save
                            </button>
                        </div>
                        <div className="button-container">
                            <button className="btn-default" onClick={handleAskAI} disabled={aiInProgress}>
                                Ask AI
                            </button>
                            <button className="btn-default" onClick={handleFillInGaps} disabled={aiInProgress}>
                                Fill in gaps
                            </button>
                            <button className="btn-default" onClick={handleFleshOutMessage} disabled={aiInProgress}>
                                Flesh out message
                            </button>
                        </div>
                    </div>
                )}
                {aiInProgress && (
                    <div className="spinner-container">
                        <CircularProgress size={40} />
                    </div>
                )}
            </div>
            <Popover
                open={showingAddPhrase}
                onClose={() => setShowingAddPhrase(false)}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                }}
            >
                <SavePhrasePopover
                    phrase={text}
                    onClosed={() => setShowingAddPhrase(false)}
                />
            </Popover>
        </BaseLayout>
    );
}

export default TypingPage;