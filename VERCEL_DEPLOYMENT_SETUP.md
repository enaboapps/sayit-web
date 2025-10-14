# Vercel Deployment Setup Guide

This guide will help you set up automated Vercel deployments triggered by GitHub releases.

## Table of Contents
1. [Get Vercel Credentials](#1-get-vercel-credentials)
2. [Configure GitHub Secrets](#2-configure-github-secrets)
3. [Configure Vercel Project](#3-configure-vercel-project)
4. [Test the Workflow](#4-test-the-workflow)
5. [Creating Releases](#5-creating-releases)

---

## 1. Get Vercel Credentials

### Step 1.1: Get Your Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a name like "GitHub Actions Deploy"
4. Set the scope to **"Full Access"** (or at minimum, read/write access to your project)
5. Set expiration (recommend "No Expiration" for CI/CD)
6. Click **"Create Token"**
7. **Copy the token immediately** - you won't be able to see it again!

### Step 1.2: Get Your Vercel Organization ID

**Option A: Via Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to your project directory
cd /home/owen-mcgirr/source/sayit-web

# Link your project (this will show you the IDs)
vercel link
```

After running `vercel link`, check the `.vercel/project.json` file:
```bash
cat .vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

**Option B: Via Vercel Dashboard**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings** in the top navigation
3. Look for **"Team ID"** or **"Organization ID"** in the General section
4. Copy the ID (starts with `team_` for teams or `user_` for personal accounts)

### Step 1.3: Get Your Vercel Project ID

**Option A: Via CLI (easiest - see Step 1.2 above)**

**Option B: Via Vercel Dashboard**

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on the project name
3. Go to **Settings**
4. Scroll down to **"Project ID"**
5. Copy the ID (starts with `prj_`)

**Option C: Via Project Settings URL**

The project ID is in the URL when you're in project settings:
```
https://vercel.com/[team-name]/[project-name]/settings
                                                  ^
                                            Project ID is here
```

---

## 2. Configure GitHub Secrets

### Step 2.1: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click on **Settings** (repository settings, not your account)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**

Add these three secrets one by one:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VERCEL_TOKEN` | Your token from Step 1.1 | Authentication token |
| `VERCEL_ORG_ID` | Your org ID from Step 1.2 | Starts with `team_` or `user_` |
| `VERCEL_PROJECT_ID` | Your project ID from Step 1.3 | Starts with `prj_` |

### Step 2.2: Verify Secrets

After adding all three secrets, you should see them listed (values will be hidden for security).

---

## 3. Configure Vercel Project

### Step 3.1: Disable Automatic Deployments

To ensure deployments only happen via GitHub Actions:

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings**
3. Go to **Git** section
4. Under **"Deploy Hooks"**, find **"Ignored Build Step"**
5. Add a custom ignore command:

```bash
# Option 1: Always ignore (recommended if using GitHub Actions exclusively)
exit 1
```

Or use the Vercel UI:
- Scroll to **"Git"** → **"Ignored Build Step"**
- Enter command: `exit 1`
- Click **Save**

### Step 3.2: Alternative - Use Environment Variable

You can also conditionally ignore builds:

1. In Vercel Project Settings → **Environment Variables**
2. Add a new variable:
   - Key: `SKIP_VERCEL_AUTO_DEPLOY`
   - Value: `true`
   - Environment: `Production`, `Preview`, `Development`

3. Create a `vercel.json` file in your project root:

```json
{
  "ignoreCommand": "[ \"$SKIP_VERCEL_AUTO_DEPLOY\" = \"true\" ] && exit 1 || exit 0"
}
```

### Step 3.3: Configure Build Settings (Optional)

Verify your build settings in Vercel:

1. **Framework Preset**: Next.js (should be auto-detected)
2. **Build Command**: `next build` (default)
3. **Output Directory**: `.next` (default)
4. **Install Command**: `npm install` (default)
5. **Node Version**: 20.x (matches GitHub Action)

---

## 4. Test the Workflow

### Step 4.1: Commit and Push the Workflow

The workflow file has been created at `.github/workflows/vercel-deploy.yml`.

```bash
git add .github/workflows/vercel-deploy.yml
git commit -m "Add GitHub Actions workflow for Vercel deployment"
git push origin main
```

### Step 4.2: Create a Test Release

See [Section 5](#5-creating-releases) for detailed instructions on creating releases.

Quick test:
```bash
# Create and push a tag
git tag v1.8.1
git push origin v1.8.1

# Then go to GitHub and create a release from this tag
```

### Step 4.3: Monitor the Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see a new workflow run for "Deploy to Vercel Production"
4. Click on it to see the deployment progress
5. Check the logs for any errors

---

## 5. Creating Releases

### Option A: Via GitHub UI

1. Go to your repository on GitHub
2. Click **Releases** (in the right sidebar, or go to `/releases`)
3. Click **"Draft a new release"**
4. Click **"Choose a tag"** and type a new tag (e.g., `v1.8.1`)
5. Select **"Create new tag on publish"**
6. Fill in:
   - **Release title**: e.g., "Version 1.8.1"
   - **Description**: Add release notes (what's new, bug fixes, etc.)
7. Check **"Set as the latest release"** (if applicable)
8. Click **"Publish release"**

This will trigger the GitHub Action automatically!

### Option B: Via GitHub CLI

```bash
# Make sure you have gh CLI installed
# Install: https://cli.github.com/

# Create a release
gh release create v1.8.1 \
  --title "Version 1.8.1" \
  --notes "Bug fixes and improvements" \
  --latest

# With release notes from a file
gh release create v1.8.1 \
  --title "Version 1.8.1" \
  --notes-file CHANGELOG.md \
  --latest

# Create a pre-release (won't trigger production deploy)
gh release create v1.8.1-beta \
  --title "Version 1.8.1 Beta" \
  --notes "Beta release for testing" \
  --prerelease
```

### Option C: Via Git Tags + GitHub UI

```bash
# Create and push a tag
git tag -a v1.8.1 -m "Version 1.8.1"
git push origin v1.8.1

# Then go to GitHub → Releases → Draft new release
# Select the existing tag v1.8.1
# Fill in details and publish
```

### Release Naming Convention

Use semantic versioning:
- `v1.0.0` - Major release (breaking changes)
- `v1.1.0` - Minor release (new features, backwards compatible)
- `v1.1.1` - Patch release (bug fixes)
- `v1.1.0-beta.1` - Pre-release (testing, won't deploy to production)

---

## 6. Troubleshooting

### Workflow Fails with "Resource not accessible by integration"

**Solution**: Make sure your GitHub repository has the correct permissions:
1. Settings → Actions → General
2. Under "Workflow permissions", select **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"**

### "Error: No Project Settings found"

**Solution**: Run `vercel link` in your project directory first to connect your local project to Vercel.

### Deployment Succeeds but Site Not Updated

**Solution**:
- Check if you're deploying to the correct Vercel project
- Verify the `VERCEL_PROJECT_ID` matches your project
- Check Vercel dashboard for deployment status

### "Authentication error" or "Invalid token"

**Solution**:
- Verify your `VERCEL_TOKEN` is correct
- Make sure the token has full access or at least deploy permissions
- Check if the token has expired

### Multiple Deployments Happening

**Solution**: Make sure you've disabled automatic deployments in Vercel (see Step 3.1)

---

## 7. Advanced Configuration

### Deploy to Preview Environment on Pre-releases

Modify `.github/workflows/vercel-deploy.yml` to add a preview deployment job:

```yaml
on:
  release:
    types: [published, prereleased]

jobs:
  deploy-production:
    if: github.event.release.prerelease == false
    # ... existing production deployment steps

  deploy-preview:
    if: github.event.release.prerelease == true
    runs-on: ubuntu-latest
    steps:
      # Same steps but remove --prod flag
      - name: Deploy to Vercel Preview
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### Add Slack/Discord Notifications

Add a notification step at the end of the workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment ${{ job.status }}: ${{ github.event.release.tag_name }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 8. Useful Commands

```bash
# Check workflow status
gh run list --workflow=vercel-deploy.yml

# View workflow logs
gh run view

# List all releases
gh release list

# Delete a release
gh release delete v1.8.1

# View Vercel deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

---

## Summary Checklist

- [ ] Created Vercel token
- [ ] Got Vercel Organization ID
- [ ] Got Vercel Project ID
- [ ] Added all three secrets to GitHub
- [ ] Disabled automatic Vercel deployments
- [ ] Committed workflow file to repository
- [ ] Created a test release
- [ ] Verified deployment succeeded
- [ ] Checked production site is updated

---

For more information:
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)
