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
import { Popover } from '@mui/material';

function TypingPage() {
    const [text, setText] = React.useState("");
    const [showingAddPhrase, setShowingAddPhrase] = React.useState(false);

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

    return (
        <BaseLayout>
            <div className="container">
                <textarea className="text-area" value={text} onChange={handleTextChange} />
                {text.length > 0 && (
                    <div className="grid-container">
                        <button className="flat-button" style={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }} onClick={handleSpeakText}>Speak</button>
                        <button className="flat-button" onClick={handleClearText}>Clear</button>
                        <button className="flat-button" style={{ borderTopRightRadius: 20, borderBottomRightRadius: 20 }} onClick={handleSaveText}>Save</button>
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