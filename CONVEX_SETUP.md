# Convex Setup Instructions

## Prerequisites
1. Convex account (https://convex.dev)
2. Clerk publishable key from dashboard

## Setup Steps

### 1. Login to Convex
```bash
npx convex dev
```
Follow prompts to:
- Login to Convex
- Create a new project or select existing
- Configure deployment

### 2. Configure Clerk Integration

In Convex Dashboard:
1. Go to Settings > Environment Variables
2. Add `CLERK_JWT_ISSUER_DOMAIN`
   - Get from Clerk Dashboard > API Keys > JWT Template
   - Format: `https://your-app.clerk.accounts.dev`

### 3. Add Convex URL to Environment

After running `npx convex dev`, copy the deployment URL and add to `.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. Update Clerk Dashboard

In Clerk Dashboard > JWT Templates:
1. Create new template named "convex"
2. Add Convex deployment URL to "Audience" field
3. Save template

### 5. Start Development

```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Next.js dev server
npm run dev
```

## Configuration Files Created

- `convex/schema.ts` - Database schema
- `convex/auth.config.ts` - Clerk authentication
- `convex/users.ts` - User helper functions
- `convex/phrases.ts` - Phrase CRUD operations
- `convex/tsconfig.json` - TypeScript configuration

## Next Steps

1. Create remaining Convex functions:
   - `phraseBoards.ts`
   - `typingSessions.ts`
   - `profiles.ts`

2. Update application code to use Convex hooks:
   - Replace `DatabaseService` calls with `useQuery`/`useMutation`
   - Update API routes to use Convex server-side functions

3. Test all functionality

## Resources

- [Convex Docs](https://docs.convex.dev/)
- [Convex + Clerk Guide](https://docs.convex.dev/auth/clerk)
- [Convex React Hooks](https://docs.convex.dev/client/react)
