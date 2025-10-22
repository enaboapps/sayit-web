# SayIt! Web Application

SayIt! is an AI-powered augmentative and alternative communication (AAC) app that helps users express their thoughts, feelings, needs, and wants more effectively. The app features AI-assisted phrase generation, smart suggestions, and a "Flesh Out" feature that helps users articulate complex ideas.

## Features

- AI-powered "Flesh Out" feature to expand on simple phrases
- AI-assisted phrase generation for expressing feelings, needs, wants, and thoughts
- Smart phrase suggestions
- High-quality text-to-speech using ElevenLabs API
- User authentication and account management
- Subscription-based premium features via Stripe
- PWA support for offline access

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Clerk for authentication
- Convex for realtime data and storage
- Stripe for payment processing
- DeepInfra AI SDK for AI features
- ElevenLabs for high-quality text-to-speech

## Required Environment Variables

To run this application, you need to set up the following environment variables:

```
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI Configuration
DEEPINFRA_API_KEY=your_deepinfra_api_key

# ElevenLabs Configuration (for high-quality TTS)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Setting up ElevenLabs TTS (Optional)

To use the high-quality ElevenLabs text-to-speech:

1. Create an account at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from your account settings
3. Add it to your environment variables:
   - Using Vercel: Add the `ELEVENLABS_API_KEY` environment variable in your project settings
   - Local development: Add the key to your `.env.local` file

If the ElevenLabs API key is not provided, the application will fall back to using the browser's native Web Speech API.

## Deployment

To deploy a production build, push to the `production` branch.
