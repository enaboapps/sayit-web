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

To run this application, you need to set up the following environment variables in your `.env.local` file:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Clerk Webhook Secret (for user sync)
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI Configuration
DEEPINFRA_API_KEY=your_deepinfra_api_key

# ElevenLabs Configuration (for high-quality TTS)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd sayit-web
npm install
```

### 2. Set up Convex

1. Create a [Convex](https://convex.dev/) account
2. Create a new project
3. Run `npx convex dev` to initialize and get your deployment URL
4. Add the Convex environment variables to `.env.local`

### 3. Set up Clerk Authentication

1. Create a [Clerk](https://clerk.com/) account
2. Create a new application
3. Get your publishable and secret keys
4. Configure the Clerk webhook:
   - In Clerk Dashboard, go to Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

### 4. Set up Stripe

1. Create a [Stripe](https://stripe.com/) account
2. Get your API keys from the Dashboard
3. Create a subscription product and price
4. Add the keys to your environment variables

### 5. Set up AI Services

**DeepInfra** (for AI features):
- Create account at [DeepInfra](https://deepinfra.com/)
- Get API key and add to environment variables

**ElevenLabs** (for high-quality TTS):
- Create account at [ElevenLabs](https://elevenlabs.io/)
- Get API key and add to environment variables
- If not provided, app falls back to browser's Web Speech API

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

This application is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

The application will automatically deploy on push to the `main` branch.
