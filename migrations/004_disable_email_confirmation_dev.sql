-- DEVELOPMENT ONLY: Disable email confirmation for easier testing
-- WARNING: Do NOT run this in production!
-- 
-- This script disables email confirmation requirement for new signups
-- to avoid rate limiting issues during development.
--
-- To run this:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste and run this script
-- 3. New users can login immediately without email confirmation

-- Check current settings first
SELECT * FROM auth.config;

-- Update auth config to disable email confirmation
-- Uncomment the following lines to execute:

/*
UPDATE auth.config 
SET 
  mailer_autoconfirm = true,
  security_update_password_require_reauthentication = false
WHERE id = 'default';
*/

-- Alternative: Set specific project settings
-- This is safer as it only affects email settings

/*
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT now();
*/

-- To revert (re-enable email confirmation):
/*
UPDATE auth.config 
SET 
  mailer_autoconfirm = false,
  security_update_password_require_reauthentication = true
WHERE id = 'default';
*/