import type { User } from "./types";

// Passwords are stored as SHA-256(SALT + plaintext).
// Never store or log plaintext passwords.
// To add a user: compute SHA-256("M5OS_INTERNAL_SALT_V1" + plainPassword) and add below.

export const USERS: User[] = [
  {
    id: "usr_master_001",
    email: "guimaraes.victorb@gmail.com",
    displayName: "Victor Guimarães",
    role: "master",
    // SHA-256("M5OS_INTERNAL_SALT_V1" + "Bia1234!")
    passwordHash: "d75288bc6df59c21e21e1d598038cbfa5691caf50f391139f469b4b18cf2c99f",
    createdAt: "2025-01-01",
  },
];
