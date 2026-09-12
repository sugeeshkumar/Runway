-- Migration V3: Add default_currency column to users table
ALTER TABLE users ADD COLUMN default_currency VARCHAR(3) NOT NULL DEFAULT 'INR';
