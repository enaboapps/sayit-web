export type GeminiVoice = {
  voice_id: string;
  name: string;
  style: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  languageCodes?: { bcp47: string; iso639_3: string; display: string }[];
};

export const GEMINI_VOICES: GeminiVoice[] = [
  { voice_id: 'Zephyr', name: 'Zephyr (Bright)', style: 'Bright', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Puck', name: 'Puck (Upbeat)', style: 'Upbeat', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Charon', name: 'Charon (Informative)', style: 'Informative', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Kore', name: 'Kore (Firm)', style: 'Firm', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Fenrir', name: 'Fenrir (Excitable)', style: 'Excitable', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Leda', name: 'Leda (Youthful)', style: 'Youthful', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Orus', name: 'Orus (Firm)', style: 'Firm', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Aoede', name: 'Aoede (Breezy)', style: 'Breezy', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Callirrhoe', name: 'Callirrhoe (Easy-going)', style: 'Easy-going', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Autonoe', name: 'Autonoe (Bright)', style: 'Bright', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Enceladus', name: 'Enceladus (Breathy)', style: 'Breathy', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Iapetus', name: 'Iapetus (Clear)', style: 'Clear', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Umbriel', name: 'Umbriel (Easy-going)', style: 'Easy-going', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Algieba', name: 'Algieba (Smooth)', style: 'Smooth', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Despina', name: 'Despina (Smooth)', style: 'Smooth', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Erinome', name: 'Erinome (Clear)', style: 'Clear', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Algenib', name: 'Algenib (Gravelly)', style: 'Gravelly', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Rasalgethi', name: 'Rasalgethi (Informative)', style: 'Informative', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Laomedeia', name: 'Laomedeia (Upbeat)', style: 'Upbeat', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Achernar', name: 'Achernar (Soft)', style: 'Soft', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Alnilam', name: 'Alnilam (Firm)', style: 'Firm', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Schedar', name: 'Schedar (Even)', style: 'Even', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Gacrux', name: 'Gacrux (Mature)', style: 'Mature', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Pulcherrima', name: 'Pulcherrima (Forward)', style: 'Forward', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Achird', name: 'Achird (Friendly)', style: 'Friendly', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Zubenelgenubi', name: 'Zubenelgenubi (Casual)', style: 'Casual', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Vindemiatrix', name: 'Vindemiatrix (Gentle)', style: 'Gentle', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Sadachbia', name: 'Sadachbia (Lively)', style: 'Lively', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Sadaltager', name: 'Sadaltager (Knowledgeable)', style: 'Knowledgeable', gender: 'Unknown', languageCodes: [] },
  { voice_id: 'Sulafat', name: 'Sulafat (Warm)', style: 'Warm', gender: 'Unknown', languageCodes: [] },
];

export const DEFAULT_GEMINI_VOICE_ID = 'Puck';
export const GEMINI_FLASH_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
