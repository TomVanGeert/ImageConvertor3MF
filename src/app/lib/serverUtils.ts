// app/lib/serverUtils.ts
import crypto from "crypto";
import bcrypt from "bcrypt";

/** Generate a secure random token for sessions */
export function generateToken(length = 48): string {
  return crypto.randomBytes(length).toString("hex");
}

/** Hash a password using bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a password against a hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
