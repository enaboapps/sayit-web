# SayIt! Web Application

SayIt! is an AI-powered augmentative and alternative communication (AAC) app that helps users express their thoughts, feelings, needs, and wants more effectively.

**Live app:** [sayitaac.com](https://sayitaac.com)

## Features

- **Phrase Boards** - Create and organize phrases into customizable boards
- **AI-powered "Flesh Out"** - Expand simple phrases into complete thoughts
- **High-quality Text-to-Speech** - Natural voice output using ElevenLabs
- **Caregiver Mode** - Create and manage boards for multiple clients (Pro)
- **Communicator Mode** - Use boards created by caregivers or create your own
- **Real-time Sync** - Changes sync instantly across devices
- **PWA Support** - Install as an app on any device

## Tech Stack

- Next.js 15 / React 19 / TypeScript
- Tailwind CSS / Framer Motion
- Clerk (authentication & billing)
- Convex (real-time database)
- DeepInfra (AI features)
- ElevenLabs (text-to-speech)

## Development

This is a closed-source application. The repository is for development purposes only.

```bash
npm install
npm run dev
```

## Deployment

Deployments happen automatically via Vercel when a new release is created. See [AGENTS.md](./AGENTS.md) for the release process.
