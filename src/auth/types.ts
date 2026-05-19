export type UserRole = "master" | "viewer";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordHash: string; // SHA-256(SALT + plaintext)
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

export interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  lockedSeconds?: number;
}
