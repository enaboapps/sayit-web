// This view allows the user to type what they want to say
// It will contain the text that the user is typing in a text area
// It will contain buttons to speak the text and clear the text
// It will contain a button to save the text as a phrase

import React from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import './TypingPage.css';

function TypingPage() {
    const [text, setText] = React.useState("");

    const handleTextChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setText(event.target.value);
    }

    const handleClearText = () => {
        setText("");
    }

    const handleSaveText = () => {
        // TODO: Save the text as a phrase
    }

    const handleSpeakText = () => {
        // TODO: Speak the text
    }

    return (
        <BaseLayout>
            <div className="container">
                <textarea className="text-area" value={text} onChange={handleTextChange} />
                {text.length > 0 && (
                    <div className="button-container">
                        <button className="btn" onClick={handleSpeakText}>
                            Speak
                        </button>
                        <button className="btn" onClick={handleClearText}>
                            Clear
                        </button>
                        <button className="btn" onClick={handleSaveText}>
                            Save
                        </button>
                    </div>
                )}
            </div>
        </BaseLayout>
    );
}

export default TypingPage;