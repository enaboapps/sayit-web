// This class uses the Web Speech API.

import getSpeechSettings from "./SpeechSettings";

class SpeechService {
    // The SpeechSynthesisUtterance object is used to store data that will be spoken
    utterance;

    // The SpeechSynthesis object is used to speak the utterance
    synth;

    constructor() {
        this.utterance = new SpeechSynthesisUtterance();
        this.synth = window.speechSynthesis;
    }

    // Speak the given text
    async speak(text: string) {
        console.log(`Speaking: ${text}`);
        this.utterance.text = text;
        let voice = await getSpeechSettings().getVoice();
        if (voice === "") {
            if (this.getVoices().length > 0) {
                voice = this.getVoices()[0].name;
            }
        }
        this.utterance.voice = this.synth.getVoices().filter((v) => {
            return v.name === voice;
        })[0];
        this.synth.speak(this.utterance);
    }

    // Stop speaking
    stop() {
        this.synth.cancel();
    }

    // Get the list of voices
    getVoices() {
        return this.synth.getVoices();
    }
}

let speechService: SpeechService | null = null;   // singleton

// Get the singleton instance of SpeechService
function getSpeechServiceInstance() {
    if (speechService == null) {
        speechService = new SpeechService();
    }
    return speechService;
}

export default getSpeechServiceInstance;