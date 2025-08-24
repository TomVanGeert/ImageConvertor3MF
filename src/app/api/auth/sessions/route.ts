// src/app/api/auth/sessions/route.ts
import crypto from "crypto";

// In-memory session store
export const sessions: Record<string, string> = {}; // { sessionToken: userId }

// Generate a new session token
export function createSession(userId: string) {
  const token = crypto.randomUUID();
  sessions[token] = userId;
  return token;
}

// Delete a session token
export function deleteSession(token: string) {
  delete sessions[token];
}

// Get userId from token
export function getUserId(token: string) {
  return sessions[token];
}
