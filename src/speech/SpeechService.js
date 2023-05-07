// This class uses the Web Speech API.

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
    speak(text) {
        console.log(`Speaking: ${text}`);
        this.utterance.text = text;
        this.utterance.voice = this.synth.getVoices()[0];
        this.synth.speak(this.utterance);
    }

    // Stop speaking
    stop() {
        this.synth.cancel();
    }
}

let speechService = null;   // singleton

// Get the singleton instance of SpeechService
function getSpeechServiceInstance() {
    if (speechService == null) {
        speechService = new SpeechService();
    }
    return speechService;
}

export default getSpeechServiceInstance;