// This class uses the Web Speech API.

import getSpeechSettings from "./SpeechSettings";

class SpeechService {
    private synth: SpeechSynthesis;
    voicesLoaded: Promise<void>;

    constructor() {
        this.synth = window.speechSynthesis;
        this.voicesLoaded = new Promise<void>((resolve) => {
            if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => resolve();
            } else {
                resolve();
            }
        });
    }

    // Set the voice to use
    async setVoice(voiceName: string) {
        const voices = await this.getVoices();
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
            const speechSettings = getSpeechSettings();
            await speechSettings.setVoice(voiceName);
        }
    }

    // Speak the given text
    async speak(text: string) {
        console.log(`Speaking: ${text}`);
        const voices = await this.getVoices();
        const speechSettings = getSpeechSettings();
        const voiceName = await speechSettings.getVoice();
        const voice = voices.find((v) => v.name === voiceName);
        const utterThis = new SpeechSynthesisUtterance(text);
        if (voice) {
            utterThis.voice = voice;
        }
        this.synth.speak(utterThis);
    }

    // Stop speaking
    stop() {
        this.synth.cancel();
    }

    // Get the list of voices
    async getVoices() {
        await this.voicesLoaded;
        return this.synth.getVoices();
    }
}

let speechService: SpeechService | null = null;   // singleton

// Get the singleton instance of SpeechService
async function getSpeechServiceInstance() {
    if (speechService == null) {
        speechService = new SpeechService();
        await speechService.voicesLoaded;
    }
    return speechService;
}

export default getSpeechServiceInstance;