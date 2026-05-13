-- Migration: Add user tracking fields
-- Description: Adds totalEarnings, createdAt, and lastActive columns to users table

-- Add totalEarnings column
ALTER TABLE users 
ADD COLUMN totalEarnings FLOAT DEFAULT 0 AFTER houseFee;

-- Add createdAt column
ALTER TABLE users 
ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP AFTER totalEarnings;

-- Add lastActive column
ALTER TABLE users 
ADD COLUMN lastActive DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Update existing users to have current timestamp
UPDATE users 
SET createdAt = CURRENT_TIMESTAMP, 
    lastActive = CURRENT_TIMESTAMP 
WHERE createdAt IS NULL;
