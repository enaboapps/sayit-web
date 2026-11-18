// Shared secret for Convex functions that only trusted server code may call,
// such as the Clerk webhook's profile sync. Set CONVEX_WEBHOOK_SECRET to the
// same random value (32+ characters) in Convex and in the Next.js server.

const MIN_SECRET_LENGTH = 32;

function constantTimeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function assertServerSecret(provided: string) {
  const expected = process.env.CONVEX_WEBHOOK_SECRET;
  if (!expected || expected.length < MIN_SECRET_LENGTH) {
    throw new Error('Server secret is not configured');
  }
  if (!constantTimeEqual(provided, expected)) {
    throw new Error('Unauthorized');
  }
}
