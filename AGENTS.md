# SayIt! Web - AI Agent Development Guide

> **Main branch protection:**  
> Never commit or push directly to `main`.  
> Always use a feature or fix branch created from `main`—see "Branch Strategy" below for workflow.  
> Direct changes to `main` are prohibited to preserve codebase integrity, CI reliability, and production stability.

## Project Overview

SayIt! is an AI-powered augmentative and alternative communication (AAC) web application that helps users express their thoughts, feelings, needs, and wants more effectively. Built with Next.js, React, and TypeScript, the app provides AI-assisted phrase generation, smart suggestions, and text-to-speech capabilities to support users who need communication assistance.

**Key Technologies:**
- Next.js 16 with React 19 (Turbopack enabled)
- TypeScript
- Convex (realtime data and storage)
- Clerk (authentication)
- OpenRouter with Google Gemini (AI features)
- ElevenLabs (text-to-speech)
- Tailwind CSS + Framer Motion

## Development Workflow

### 1. Issue Creation

Every piece of work starts with a GitHub issue:
- Create an issue for each feature, bug fix, or task
- Attach the issue to the **latest milestone**
- Provide clear description and acceptance criteria

### 2. Branch Strategy

For each issue:
- Create a new branch from `main`
- Branch naming should reference the issue (e.g., `feature/issue-123-add-voice-settings`)
- All development work happens in this feature branch

### 3. Build Requirements

**Always build before committing:**
```bash
npm run build
```

Ensure the build passes successfully. Do not create PRs with broken builds.

### 4. Pull Request Process

When work is complete:
- Create a Pull Request against `main`
- Reference the issue number in the PR description
- Ensure all checks pass
- Request review if needed
- Merge when approved

### 5. Release Process

Releases are created when a milestone is complete:

**Step 0: Create a Release Branch**

Before starting the release process, create a dedicated release branch from the current `main` branch.

1. Make sure you are on `main` and it is up-to-date:
   ```bash
   git checkout main
   git pull
   ```

2. Check the current open milestone on GitHub — its title is the intended release version:
   ```bash
   gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.state=="open") | .title'
   ```

3. Create a new release branch named after that milestone version:
   ```bash
   git checkout -b release/vX.Y.Z
   ```
   For example, if the open milestone is `v1.2.0`:
   ```bash
   git checkout -b release/v1.2.0
   ```

Perform all subsequent release steps in this branch before merging it back into `main` and tagging the release.


**Step 1: Run Tests**
```bash
# Ensure all tests pass before release
npm test
```

Do not proceed with release if any tests fail.

**Step 2: Run Linting**
```bash
# Fix any linting issues before release
npx eslint . --ext .js,.jsx,.ts,.tsx --fix
```

**Step 3: Commit and Push Lint Fixes**
```bash
git add -A
git commit -m "Fix linting issues with auto-fix"
git push
```

**Step 4: Version Bump**
```bash
# Choose based on milestone type:
npm version major  # Breaking changes (1.0.0 -> 2.0.0)
npm version minor  # New features (1.0.0 -> 1.1.0)
npm version patch  # Bug fixes (1.0.0 -> 1.0.1)
```

This command will:
- Update version in package.json
- Create a git commit with the version bump
- Create a git tag (e.g., v1.15.0)

**Step 5: Push Commits and Tags**
```bash
git push && git push --tags
```

Pushing the tag triggers the **Release GitHub Action** (`.github/workflows/release.yml`) which will:
- Build the project
- Automatically create the GitHub Release with auto-generated notes

Vercel automatically deploys to production when the release is created.

**Step 6: Close Milestone**
```bash
# Close the milestone (use milestone number from GitHub)
gh api repos/enaboapps/sayit-web/milestones/<number> -X PATCH -f state=closed
```

## Working with AI Agents

When working with AI agents on this project:

1. **Always create an issue first** - Don't start coding without a tracked issue
2. **Work in feature branches** - Never commit directly to `main`
3. **Run tests before PR** - Run `npm test` to catch regressions
4. **Build before PR** - Run `npm run build` to catch issues early
5. **Follow the release process** - Use npm version commands and gh CLI for releases
6. **Check dependencies** - Ensure any new dependencies align with the existing tech stack

## Project Structure

```
sayit-web/
├── app/              # Next.js app directory
├── components/       # React components
├── convex/          # Convex backend functions
├── lib/             # Utility functions
├── public/          # Static assets
├── tests/           # Jest test suites
└── ...
```

## Important Notes

- This is a PWA (Progressive Web App) with offline support
- Authentication is handled by Clerk
- AI features require DeepInfra API key
- High-quality TTS requires ElevenLabs API key (falls back to browser TTS)
- All user data is stored in Convex
