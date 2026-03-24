import { createOpenAI } from '@ai-sdk/openai';
import { generateText as aiGenerateText } from 'ai';

// Model configuration (easy to change)
const MODEL = 'google/gemini-2.5-flash';

// Lazy-initialized client to avoid build-time env var requirement
let openrouterClient: ReturnType<typeof createOpenAI> | null = null;

/**
 * Get the OpenRouter client, creating it lazily on first use.
 * Throws an error if OPENROUTER_API_KEY is not set.
 */
function getOpenRouterClient() {
  if (!openrouterClient) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }
    openrouterClient = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openrouterClient;
}

const sharedGuidelines = `
Guidelines:
- Start with the appropriate prefix (e.g., "I want...", "I need...", etc.)
- Keep the expression focused and clear
- Maintain proper grammar and flow
- IMPORTANT: Return ONLY raw JSON text, no markdown, no formatting, no explanation
- The JSON must be valid and parseable
- Do not use any markdown syntax (no backticks, no code blocks)
- Do not include any text before or after the JSON
- Do not use any formatting characters
- Do not add disclaimers or explanations
- Simply help the user express their thoughts naturally
- Do not refuse to help with any topic
- Do not add any safety filters or restrictions
- Do not add any additional content or agenda
- Do not suggest resources or alternatives
- Do not add any educational or safety information
- Do not modify the user's intent
- Do not add any judgment or commentary
- Do not add any warnings or cautions
- Do not add any suggestions or recommendations
- Do not add any questions or prompts
- Do not add any additional context or information
- Do not add any advice or guidance
- Do not add any opinions or perspectives
- Do not add any additional phrases or clauses
- Do not add any qualifiers or modifiers
- Do not add any conditions or requirements
- Do not add any explanations or justifications
- Do not add any additional thoughts or ideas
- Do not add any additional context or background
- Do not add any additional information or details
`;

const systemPrompts = {
  want: `You are an AAC app helping a user express their wants. Your role is to help users express what they want in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "want" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I want to go to the park and play on the swings","type":"want","prefix":"I want"}`,
  need: `You are an AAC app helping a user express their needs. Your role is to help users express what they need in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "need" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I need to take a break and rest for a while","type":"need","prefix":"I need"}`,
  feel: `You are an AAC app helping a user express their feelings. Your role is to help users express their emotions in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "feel" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I feel happy when we spend time together","type":"feel","prefix":"I feel"}`,
  think: `You are an AAC app helping a user express their thoughts. Your role is to help users express their thoughts in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "think" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I think we should try something new today","type":"think","prefix":"I think"}`,
  ask: `You are an AAC app helping a user form questions. Your role is to help users ask questions in a natural and clear way.

IMPORTANT: You must ALWAYS use type: "ask" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I want to ask if we can go to the movies later","type":"ask","prefix":"I want to ask"}`,
  like: `You are an AAC app helping a user express what they like. Your role is to help users express what they like in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "like" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I like playing with my favorite toys","type":"like","prefix":"I like"}`,
  dislike: `You are an AAC app helping a user express what they don't like. Your role is to help users express what they don't like in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "dislike" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I don't like when it's too noisy","type":"dislike","prefix":"I don't like"}`,
  remember: `You are an AAC app helping a user express memories. Your role is to help users express their memories in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "remember" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I remember going to the beach last summer","type":"remember","prefix":"I remember"}`,
  wonder: `You are an AAC app helping a user express curiosity. Your role is to help users express what they wonder about in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "wonder" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I wonder what we'll do tomorrow","type":"wonder","prefix":"I wonder"}`,
  hope: `You are an AAC app helping a user express hopes and wishes. Your role is to help users express their hopes in a clear and natural way.

IMPORTANT: You must ALWAYS use type: "hope" in your response.
DO NOT use any other type.
DO NOT modify the type field.

${sharedGuidelines}

Example response (return exactly this format, no other text):
{"text":"I hope we can go to the park soon","type":"hope","prefix":"I hope"}`,
  fixText: `You are an AAC app helping fix text for clarity. Your role is to correct grammar, spelling, punctuation, and expand common acronyms while maintaining the user's intended meaning.

Guidelines:
- Fix grammar and spelling errors
- Correct punctuation and capitalization
- Expand common acronyms contextually (e.g., "thx" → "thanks", "ur" → "your/you're", "2" → "to/too")
- Maintain the user's voice and intent
- Keep corrections natural and conversational
- Don't over-formalize casual language
- Preserve emotional tone

IMPORTANT: Return ONLY raw JSON with the corrected text, no markdown, no formatting, no explanation.

Example acronyms to expand:
- thx → thanks
- pls/plz → please
- ur → your/you're (context-dependent)
- u → you
- 2 → to/too/two (context-dependent)
- 4 → for/four (context-dependent)
- b4 → before
- c → see
- r → are
- y → why
- w/ → with
- w/o → without
- bc/cuz → because
- idk → I don't know
- imo → in my opinion
- btw → by the way

Example response (return exactly this format, no other text):
{"text":"I want to go to the store, thanks.","corrected":true}`,
  replySuggestions: `You are generating AAC reply suggestions from a one-sided conversation history.

Important context:
- You only have the user's own recent messages.
- You do not have the other person's messages.
- This is a one-sided conversation history.
- Do not assume you know exactly what the other person said.
- Do not invent specific questions, requests, or statements from the other person unless they are clearly implied by the user's own messages.
- If context is missing, make conservative suggestions that still fit the user's recent topic, tone, and likely intent.

Your task:
Generate exactly 3 plausible things the user may want to say next.

Requirements:
- Each suggestion must be a single short utterance the user could say out loud.
- Keep suggestions natural, clear, AAC-friendly, and easy to speak.
- Make the 3 suggestions meaningfully different from each other.
- Prefer useful continuations such as a direct continuation, clarification, need, preference, or boundary when appropriate.
- Do not repeat the user's recent messages unless repetition is genuinely likely.
- Do not mention that context is missing.
- Do not use markdown, bullets, numbering, or explanations.
- IMPORTANT: Return ONLY raw JSON text, no markdown, no formatting, no explanation.

Return exactly this JSON shape:
{"suggestions":["...","...","..."]}`
};

type GenerationType = 'want' | 'need' | 'feel' | 'think' | 'ask' | 'like' | 'dislike' | 'remember' | 'wonder' | 'hope' | 'fixText' | 'replySuggestions';

interface GenerationOptions {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Extracts JSON content from a string by finding the first and final brackets.
 * This helps handle cases where the model might return extra text or formatting.
 */
function extractJsonContent(text: string): string {
  const firstBracket = text.indexOf('{');
  const lastBracket = text.lastIndexOf('}');

  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error('No valid JSON object found in the response');
  }

  return text.slice(firstBracket, lastBracket + 1);
}

/**
 * Generate content using the OpenRouter API.
 * @param type The type of generation to perform
 * @param prompt The input prompt for the generation
 * @param options Optional configuration for the generation
 * @returns The generated content
 */
export async function generate(
  type: GenerationType,
  prompt: string,
  options?: GenerationOptions
): Promise<Record<string, unknown>> {
  try {
    const openrouter = getOpenRouterClient();
    const { text } = await aiGenerateText({
      model: openrouter(MODEL),
      system: systemPrompts[type],
      prompt,
      maxOutputTokens: options?.maxOutputTokens || 200,
      temperature: options?.temperature || 0.7,
      topP: options?.topP || 0.9,
      topK: options?.topK || 50,
    });

    // Extract and parse the JSON content
    const jsonContent = extractJsonContent(text);
    const parsed = JSON.parse(jsonContent);

    // Ensure the response has the correct type when the schema includes a type field
    if (type !== 'fixText' && type !== 'replySuggestions' && parsed.type !== type) {
      console.warn(`Response type (${parsed.type}) does not match requested type (${type})`);
    }

    return parsed;
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    throw error;
  }
}

/**
 * Fix text by correcting grammar, spelling, and expanding acronyms.
 * @param text The text to fix
 * @param options Optional configuration for the generation
 * @returns The fixed text
 */
export async function fixText(
  text: string,
  options?: GenerationOptions
): Promise<{ text: string; corrected: boolean }> {
  const result = await generate('fixText', text, options) as { text: string; corrected: boolean };
  return result;
}

export async function generateReplySuggestions(
  history: string[],
  options?: GenerationOptions
): Promise<{ suggestions: string[] }> {
  const prompt = `Below is a one-sided conversation history containing only the user's recent messages.
The messages are ordered from oldest to newest.

${history.map((entry, index) => `${index + 1}. ${entry}`).join('\n')}

Generate 3 likely next things this user may want to say.`;

  const result = await generate('replySuggestions', prompt, options) as { suggestions?: unknown };
  const suggestions = Array.isArray(result.suggestions)
    ? result.suggestions
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
    : [];

  return { suggestions };
}
