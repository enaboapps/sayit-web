import { createDeepInfra } from '@ai-sdk/deepinfra';
import { generateText as aiGenerateText } from 'ai';

if (!process.env.DEEPINFRA_API_KEY) {
  throw new Error('DEEPINFRA_API_KEY is not set in environment variables');
}

const deepinfra = createDeepInfra({
  apiKey: process.env.DEEPINFRA_API_KEY,
});

const systemPromptForFleshingOut = `
You are an AAC (Augmentative and Alternative Communication) app that helps users communicate more effectively.

Your role is to:
1. Gently expand the user's input while maintaining their core meaning
2. Add only relevant and necessary details to make the message clearer
3. Keep the user's original voice and intent
4. Use natural, everyday language that's easy to understand
5. Be empathetic and supportive in tone
6. Make the expanded text flow naturally without being overly verbose

Guidelines:
- Return only the expanded text, no additional formatting or explanations
- Keep responses focused on the user's original message
- Use plain text only (no markdown, no special formatting)
- Maintain proper grammar and punctuation
- If the input is unclear, make a reasonable interpretation
- If the input is very short, expand it naturally while keeping the core meaning
- If the input is too long, focus on clarifying the key points
- Avoid adding unnecessary details or over-explaining
- Keep expansions concise and to the point

Remember: Your goal is to help users express themselves more clearly while maintaining their voice and intent. Less is often more.
`;

const systemPromptForBoardGeneration = `
You are an AAC app that generates a board based on the user's input.

A board is a list of phrases that are related to the user's input.

The input might be a situation, an object, an action, etc.

The board will be a list of phrases that are related to the user's input.

Really think about what a normal person would say in this situation.

Don't include placeholders like [object], [action], etc.

Don't repeat the same phrase twice or worded differently.

The board will be returned in a JSON array of strings.

Only return the JSON array, nothing else. Return it as a string, not markdown.
`;

/**
 * Flesh out text using the DeepInfra API.
 * @param prompt The input prompt for the text generation.
 * @param options Optional configuration for the text generation.
 * @returns The generated text.
 */
export async function fleshOut(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}): Promise<string> {
  try {
    const { text } = await aiGenerateText({
      model: deepinfra('google/gemma-3-27b-it'),
      system: systemPromptForFleshingOut,
      prompt,
      maxTokens: options?.maxTokens || 100,
      temperature: options?.temperature || 0.7,
      topP: options?.topP || 0.9,
      topK: options?.topK || 50,
    });

    return text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
} 

/**
 * Generate a board using the DeepInfra API.
 * @param prompt The input prompt for the board generation.
 * @returns The generated board.
 */
export async function generateBoard(prompt: string): Promise<string[]> {
  try {
    const { text } = await aiGenerateText({
      model: deepinfra('google/gemma-3-27b-it'),
      system: systemPromptForBoardGeneration,
      prompt,
    });

    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating board:', error);
    throw error;
  }
}