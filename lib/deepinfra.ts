import { createDeepInfra } from '@ai-sdk/deepinfra';
import { generateText as aiGenerateText } from 'ai';

if (!process.env.DEEPINFRA_API_KEY) {
  throw new Error('DEEPINFRA_API_KEY is not set in environment variables');
}

const deepinfra = createDeepInfra({
  apiKey: process.env.DEEPINFRA_API_KEY,
});

const systemPromptForTextGeneration = `
You are an AAC (Augmentative and Alternative Communication) app that helps users communicate more effectively.

Your role is to:
1. Generate clear, concise, and natural-sounding text based on the user's input
2. Maintain the user's intended meaning while improving clarity and coherence
3. Keep responses brief and to the point
4. Use simple, everyday language that's easy to understand
5. Avoid technical jargon unless necessary
6. Be empathetic and supportive in tone

Guidelines:
- Return only the generated text, no additional formatting or explanations
- Keep responses focused on a single idea or message
- Use plain text only (no markdown, no special formatting)
- Maintain proper grammar and punctuation
- If the input is unclear, make a reasonable interpretation
- If the input is very short, expand it naturally while keeping the core meaning
- If the input is too long, condense it while preserving key points

Remember: Your goal is to help users express themselves more effectively while maintaining their voice and intent.
`;

const systemPromptForBoardGeneration = `
You are an AAC app that generates a board based on the user's input.

A board is a list of phrases that are related to the user's input.

The input might be a situation, an object, an action, etc.

The board will be a list of phrases that are related to the user's input.

The board will be returned in a JSON array of strings.

Example:

Input: "I want to buy a car"

Output: ["How much is the car?", "What is the color of the car?", "What is the price of the car?"]

Only return the JSON array, nothing else.
`;

/**
 * Generate text using the DeepInfra API.
 * @param prompt The input prompt for the text generation.
 * @param options Optional configuration for the text generation.
 * @returns The generated text.
 */
export async function generateText(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}): Promise<string> {
  try {
    const { text } = await aiGenerateText({
      model: deepinfra('google/gemma-3-27b-it'),
      system: systemPromptForTextGeneration,
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