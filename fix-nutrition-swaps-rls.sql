-- Fix RLS for nutrition_swaps table
-- Run this if you're getting "no foods available" even though data exists in the table

-- Step 1: Check if RLS is enabled
-- If you get an error, RLS might not be enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'nutrition_swaps'
    ) THEN
        RAISE EXCEPTION 'Table nutrition_swaps does not exist. Please create it first.';
    END IF;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE nutrition_swaps ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on nutrition_swaps" ON nutrition_swaps;
DROP POLICY IF EXISTS "Allow public insert access on nutrition_swaps" ON nutrition_swaps;
DROP POLICY IF EXISTS "Allow public update access on nutrition_swaps" ON nutrition_swaps;

-- Step 4: Create fresh policies
CREATE POLICY "Allow public read access on nutrition_swaps" ON nutrition_swaps
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on nutrition_swaps" ON nutrition_swaps
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on nutrition_swaps" ON nutrition_swaps
FOR UPDATE USING (true);

-- Step 5: Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'nutrition_swaps';

-- Step 6: Test query (should return data if everything is correct)
SELECT COUNT(*) as total_foods FROM nutrition_swaps;

