-- Add approval system columns to counselor_profiles if they don't exist

DO $$ 
BEGIN
    -- Add approved column
    BEGIN
        ALTER TABLE counselor_profiles ADD COLUMN approved BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column approved already exists in counselor_profiles.';
    END;

    -- Add pending_reason column
    BEGIN
        ALTER TABLE counselor_profiles ADD COLUMN pending_reason TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column pending_reason already exists in counselor_profiles.';
    END;

    -- Add admin_notes column
    BEGIN
        ALTER TABLE counselor_profiles ADD COLUMN admin_notes TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column admin_notes already exists in counselor_profiles.';
    END;

    -- Add approved_at column
    BEGIN
        ALTER TABLE counselor_profiles ADD COLUMN approved_at TIMESTAMP;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column approved_at already exists in counselor_profiles.';
    END;

    -- Add approved_by column
    BEGIN
        ALTER TABLE counselor_profiles ADD COLUMN approved_by INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column approved_by already exists in counselor_profiles.';
    END;
END $$;
