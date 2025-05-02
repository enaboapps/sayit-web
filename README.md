# SayIt! Web Application

SayIt! is an AI-powered augmentative and alternative communication (AAC) app that helps users express their thoughts, feelings, needs, and wants more effectively. The app features AI-assisted phrase generation, smart suggestions, and a "Flesh Out" feature that helps users articulate complex ideas.

## Features

- AI-powered "Flesh Out" feature to expand on simple phrases
- AI-assisted phrase generation for expressing feelings, needs, wants, and thoughts
- Smart phrase suggestions
- User authentication and account management
- Subscription-based premium features via Stripe
- PWA support for offline access

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Supabase for authentication and database
- Stripe for payment processing
- DeepInfra AI SDK for AI features

## Required Environment Variables

To run this application, you need to set up the following environment variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI Configuration
DEEPINFRA_API_KEY=your_deepinfra_api_key
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

## Deployment

The easiest way to deploy the app is to use the [Vercel Platform](https://vercel.com) from the creators of Next.js.

## License

This project is privately owned and not open for public contributions.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
