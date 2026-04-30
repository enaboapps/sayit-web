# Contributing

Thanks for helping improve SayIt! Web. This project uses an issue-first workflow and keeps changes scoped.

## Workflow

1. Open or claim a GitHub issue before starting work.
2. Create a branch from `main`.
3. Reference the issue number in the branch name when practical, for example `feature/issue-123-add-voice-settings`.
4. Keep changes focused on the issue.
5. Open a pull request against `main`.

Never commit directly to `main`.

## Before Opening A Pull Request

Run:

```bash
npm run lint
npm test
npm run build
```

## Public Repository Hygiene

Do not include:

- Real user data
- Secrets, credentials, tokens, or API keys
- Screenshots containing sensitive information
- Private production logs
- Undocumented production identifiers

If a secret is exposed, assume it is compromised and rotate it.

## Larger Changes

For larger features, architecture changes, or provider integrations, open a proposal issue before implementation. Include the user problem, proposed approach, expected risks, and testing plan.

## Local Development

UI and unit-test work can often run without every provider key. Auth, Convex, AI, and premium TTS integrations require configured service accounts and values in `.env.local`.
