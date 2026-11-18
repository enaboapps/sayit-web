import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PRO_PLAN } from '@/lib/subscription';
import { userHasPro } from './pro-access';

// Who may call a route:
// - public: anyone
// - user: signed in
// - pro: signed in with SayIt Pro (or the bypass flag)
export type RouteAccess = 'public' | 'user' | 'pro';

// Throw from a handler to send `{ error: message }` with this status.
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

// Reads an env var, dropping a stray BOM and whitespace that pasted values can carry.
export function serverEnv(name: string): string | undefined {
  const value = process.env[name]?.replace(/^﻿/, '').trim();
  return value || undefined;
}

// Like serverEnv, but every name must be set or the request fails with a 500.
export function requireServerEnv<const Names extends readonly string[]>(...names: Names): { [K in Names[number]]: string } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of names) {
    const value = serverEnv(name);
    if (value) values[name] = value;
    else missing.push(name);
  }
  if (missing.length > 0) {
    console.error(`Missing server configuration: ${missing.join(', ')}`);
    throw new ApiError(500, 'API configuration error');
  }
  return values as { [K in Names[number]]: string };
}

export interface RouteContext<Body> {
  request: Request;
  body: Body;
  // Set for user and pro routes when the caller is signed in.
  userId: string | null;
}

export interface RouteOptions<Body> {
  // Used in server logs.
  name: string;
  access: RouteAccess;
  // Lets a caller through who lacks the access level, such as a signed-out
  // Live Typing viewer. Runs only after the access check fails.
  allow?: (context: { request: Request; body: Body }) => Promise<boolean>;
}

async function hasPro(userId: string, has: (params: { plan: string }) => boolean) {
  if (has({ plan: PRO_PLAN })) return true;

  // The session token says there's no plan, so only the bypass flag is left.
  return userHasPro(userId, { checkPlan: false });
}

async function checkAccess(access: RouteAccess): Promise<{ userId: string | null; denied: ApiError | null }> {
  if (access === 'public') return { userId: null, denied: null };

  const { userId, has } = await auth();
  if (!userId) return { userId: null, denied: new ApiError(401, 'Unauthorized') };
  if (access === 'user' || await hasPro(userId, has)) return { userId, denied: null };
  return { userId, denied: new ApiError(403, 'SayIt Pro is required') };
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

// Wraps a route handler with the access check, JSON body parsing and error
// responses. Errors other than ApiError are logged and sent as a plain 500,
// without internal details.
export function apiRoute<Body = Record<string, unknown>>(
  options: RouteOptions<Body>,
  handler: (context: RouteContext<Body>) => Promise<Response>,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = (await readBody(request) ?? {}) as Body;
      const { userId, denied } = await checkAccess(options.access);

      if (denied && !(options.allow && await options.allow({ request, body }))) {
        throw denied;
      }

      return await handler({ request, body, userId });
    } catch (error) {
      if (error instanceof ApiError) {
        return jsonError(error.status, error.message);
      }
      console.error(`Error in ${options.name}:`, error);
      return jsonError(500, 'Server error');
    }
  };
}
