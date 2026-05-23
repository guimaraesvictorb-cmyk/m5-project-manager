-- Phase 1: theme preference on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';
