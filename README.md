# SayIt! Web

SayIt! is an AI-powered augmentative and alternative communication (AAC) web application that helps users express thoughts, feelings, needs, and wants more effectively.

**Live app:** [sayitaac.com](https://sayitaac.com)

## Features

- Phrase boards for reusable communication
- AI-assisted text expansion and reply suggestions
- Text-to-speech with browser fallback and optional premium providers
- Caregiver and communicator workflows
- Real-time sync through Convex
- Progressive Web App support with offline text communication

## Tech Stack

- Next.js 16, React 19, and TypeScript
- Tailwind CSS and Framer Motion
- Clerk for authentication and billing
- Convex for realtime data and storage
- OpenRouter-backed AI features
- ElevenLabs, Azure, Gemini, and browser text-to-speech support

## Repository Status

This repository is prepared for public source availability and external contributions. It is contributor-oriented rather than fully self-hosting-oriented: contributors can install dependencies, run tests, and work on focused changes, while production deployment remains maintained by Enabo Apps.

## License

The source code is licensed under the GNU Affero General Public License v3.0 only. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## Brand Notice

The SayIt! name, logos, icons, domain names, and other brand assets are reserved by Enabo Apps and are not licensed for reuse except with prior written permission. Forks that are publicly deployed or redistributed must rename the app and replace the SayIt! icons, logos, domain references, and other brand identifiers.

## Development Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The development server runs at `http://localhost:3000`.

## Required Services

A cloud-backed local environment requires project-specific accounts and keys for:

- Clerk for authentication
- Convex for realtime data and storage
- OpenRouter or the configured AI provider for AI-assisted features
- ElevenLabs, Azure, or Gemini when testing premium TTS providers
- Vercel only for maintainers deploying production

Many UI and unit-test changes can be developed without every provider key. Authenticated, realtime, AI, and premium TTS flows require configured services.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:watch
npm run test:coverage
```

## Testing

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
```

## Security Reporting

Do not open public issues for exploitable security vulnerabilities. Follow [SECURITY.md](./SECURITY.md) for private reporting guidance.

## Contributing

Contributions should start with a GitHub issue and use a feature branch from `main`. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.
