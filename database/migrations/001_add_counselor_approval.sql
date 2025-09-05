-- Add approval system for counselors
-- This migration adds the approved column to counselor_profiles table

ALTER TABLE counselor_profiles 
ADD COLUMN approved BOOLEAN DEFAULT false;

-- Add index for filtering approved counselors
CREATE INDEX idx_counselor_profiles_approved ON counselor_profiles(approved);

-- Add pending_reason column to store admin feedback
ALTER TABLE counselor_profiles 
ADD COLUMN pending_reason TEXT;

-- Add admin_notes column for approval/rejection notes
ALTER TABLE counselor_profiles 
ADD COLUMN admin_notes TEXT;

-- Add approved_at timestamp
ALTER TABLE counselor_profiles 
ADD COLUMN approved_at TIMESTAMP;

-- Add approved_by reference to admin who approved
ALTER TABLE counselor_profiles 
ADD COLUMN approved_by INTEGER REFERENCES users(id);
