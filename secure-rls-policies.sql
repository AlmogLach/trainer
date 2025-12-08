-- ============================================
-- SECURE RLS POLICIES FOR UNIVERSAL FITLOG
-- ============================================
-- This file replaces the permissive RLS policies with secure, role-based access control
-- All policies are based on auth.uid() to ensure users can only access their own data
--
-- IMPORTANT: Run this AFTER setting up authentication in Supabase
-- ============================================

-- First, drop all existing permissive policies
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY[
        'users', 
        'exercise_library', 
        'workout_plans', 
        'routines', 
        'routine_exercises', 
        'workout_logs', 
        'set_logs', 
        'nutrition_swaps', 
        'daily_nutrition_logs'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = table_name) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, table_name);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- USERS TABLE
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Users can read their trainer's profile (for trainees)
CREATE POLICY "Trainees can read trainer profile" ON users
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM users WHERE trainer_id = users.id
    )
);

-- Trainers can read their trainees' profiles
CREATE POLICY "Trainers can read trainee profiles" ON users
FOR SELECT USING (
    auth.uid() IN (
        SELECT trainer_id FROM users WHERE id = users.id AND role = 'trainee'
    )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
-- This allows users to create their own record after auth.signUp()
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- EXERCISE_LIBRARY TABLE
-- ============================================
-- Everyone can read exercises (public library)
CREATE POLICY "Anyone can read exercises" ON exercise_library
FOR SELECT USING (true);

-- Only authenticated users can create exercises
CREATE POLICY "Authenticated users can create exercises" ON exercise_library
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update exercises they created
CREATE POLICY "Users can update own exercises" ON exercise_library
FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'trainer')
);

-- Users can delete exercises they created
CREATE POLICY "Users can delete own exercises" ON exercise_library
FOR DELETE USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'trainer')
);

-- ============================================
-- WORKOUT_PLANS TABLE
-- ============================================
-- Trainees can read their own active plans
CREATE POLICY "Trainees can read own plans" ON workout_plans
FOR SELECT USING (auth.uid() = trainee_id);

-- Trainers can read plans for their trainees
CREATE POLICY "Trainers can read trainee plans" ON workout_plans
FOR SELECT USING (auth.uid() = trainer_id);

-- Trainers can create plans for their trainees
CREATE POLICY "Trainers can create plans" ON workout_plans
FOR INSERT WITH CHECK (
    auth.uid() = trainer_id AND
    auth.uid() IN (SELECT trainer_id FROM users WHERE id = trainee_id)
);

-- Trainers can update plans for their trainees
CREATE POLICY "Trainers can update trainee plans" ON workout_plans
FOR UPDATE USING (auth.uid() = trainer_id);

-- Trainers can delete plans for their trainees
CREATE POLICY "Trainers can delete trainee plans" ON workout_plans
FOR DELETE USING (auth.uid() = trainer_id);

-- ============================================
-- ROUTINES TABLE
-- ============================================
-- Users can read routines from plans they have access to
CREATE POLICY "Users can read accessible routines" ON routines
FOR SELECT USING (
    plan_id IN (
        SELECT id FROM workout_plans 
        WHERE trainee_id = auth.uid() OR trainer_id = auth.uid()
    )
);

-- Trainers can create routines for their trainees' plans
CREATE POLICY "Trainers can create routines" ON routines
FOR INSERT WITH CHECK (
    plan_id IN (
        SELECT id FROM workout_plans WHERE trainer_id = auth.uid()
    )
);

-- Trainers can update routines for their trainees' plans
CREATE POLICY "Trainers can update routines" ON routines
FOR UPDATE USING (
    plan_id IN (
        SELECT id FROM workout_plans WHERE trainer_id = auth.uid()
    )
);

-- Trainers can delete routines for their trainees' plans
CREATE POLICY "Trainers can delete routines" ON routines
FOR DELETE USING (
    plan_id IN (
        SELECT id FROM workout_plans WHERE trainer_id = auth.uid()
    )
);

-- ============================================
-- ROUTINE_EXERCISES TABLE
-- ============================================
-- Users can read routine exercises from accessible routines
CREATE POLICY "Users can read accessible routine exercises" ON routine_exercises
FOR SELECT USING (
    routine_id IN (
        SELECT r.id FROM routines r
        JOIN workout_plans wp ON r.plan_id = wp.id
        WHERE wp.trainee_id = auth.uid() OR wp.trainer_id = auth.uid()
    )
);

-- Trainers can create routine exercises
CREATE POLICY "Trainers can create routine exercises" ON routine_exercises
FOR INSERT WITH CHECK (
    routine_id IN (
        SELECT r.id FROM routines r
        JOIN workout_plans wp ON r.plan_id = wp.id
        WHERE wp.trainer_id = auth.uid()
    )
);

-- Trainers can update routine exercises
CREATE POLICY "Trainers can update routine exercises" ON routine_exercises
FOR UPDATE USING (
    routine_id IN (
        SELECT r.id FROM routines r
        JOIN workout_plans wp ON r.plan_id = wp.id
        WHERE wp.trainer_id = auth.uid()
    )
);

-- Trainers can delete routine exercises
CREATE POLICY "Trainers can delete routine exercises" ON routine_exercises
FOR DELETE USING (
    routine_id IN (
        SELECT r.id FROM routines r
        JOIN workout_plans wp ON r.plan_id = wp.id
        WHERE wp.trainer_id = auth.uid()
    )
);

-- ============================================
-- WORKOUT_LOGS TABLE
-- ============================================
-- Users can read their own workout logs
CREATE POLICY "Users can read own workout logs" ON workout_logs
FOR SELECT USING (auth.uid() = user_id);

-- Trainers can read workout logs of their trainees
CREATE POLICY "Trainers can read trainee workout logs" ON workout_logs
FOR SELECT USING (
    user_id IN (
        SELECT id FROM users WHERE trainer_id = auth.uid()
    )
);

-- Users can create their own workout logs
CREATE POLICY "Users can create own workout logs" ON workout_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own workout logs
CREATE POLICY "Users can update own workout logs" ON workout_logs
FOR UPDATE USING (auth.uid() = user_id);

-- Trainers can update workout logs of their trainees
CREATE POLICY "Trainers can update trainee workout logs" ON workout_logs
FOR UPDATE USING (
    user_id IN (
        SELECT id FROM users WHERE trainer_id = auth.uid()
    )
);

-- Users can delete their own workout logs
CREATE POLICY "Users can delete own workout logs" ON workout_logs
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SET_LOGS TABLE
-- ============================================
-- Users can read set logs from their own workout logs
CREATE POLICY "Users can read own set logs" ON set_logs
FOR SELECT USING (
    log_id IN (
        SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
);

-- Trainers can read set logs from their trainees' workout logs
CREATE POLICY "Trainers can read trainee set logs" ON set_logs
FOR SELECT USING (
    log_id IN (
        SELECT wl.id FROM workout_logs wl
        JOIN users u ON wl.user_id = u.id
        WHERE u.trainer_id = auth.uid()
    )
);

-- Users can create set logs for their own workout logs
CREATE POLICY "Users can create own set logs" ON set_logs
FOR INSERT WITH CHECK (
    log_id IN (
        SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
);

-- Users can update set logs for their own workout logs
CREATE POLICY "Users can update own set logs" ON set_logs
FOR UPDATE USING (
    log_id IN (
        SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
);

-- Users can delete set logs for their own workout logs
CREATE POLICY "Users can delete own set logs" ON set_logs
FOR DELETE USING (
    log_id IN (
        SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
);

-- ============================================
-- NUTRITION_SWAPS TABLE
-- ============================================
-- Everyone can read nutrition swaps (public reference data)
CREATE POLICY "Anyone can read nutrition swaps" ON nutrition_swaps
FOR SELECT USING (true);

-- Only trainers can insert/update nutrition swaps
CREATE POLICY "Trainers can manage nutrition swaps" ON nutrition_swaps
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'trainer')
);

CREATE POLICY "Trainers can update nutrition swaps" ON nutrition_swaps
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'trainer')
);

-- ============================================
-- DAILY_NUTRITION_LOGS TABLE
-- ============================================
-- Users can read their own nutrition logs
CREATE POLICY "Users can read own nutrition logs" ON daily_nutrition_logs
FOR SELECT USING (auth.uid() = user_id);

-- Trainers can read nutrition logs of their trainees
CREATE POLICY "Trainers can read trainee nutrition logs" ON daily_nutrition_logs
FOR SELECT USING (
    user_id IN (
        SELECT id FROM users WHERE trainer_id = auth.uid()
    )
);

-- Users can create their own nutrition logs
CREATE POLICY "Users can create own nutrition logs" ON daily_nutrition_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own nutrition logs
CREATE POLICY "Users can update own nutrition logs" ON daily_nutrition_logs
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own nutrition logs
CREATE POLICY "Users can delete own nutrition logs" ON daily_nutrition_logs
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all policies were created:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN (
--     'users', 'exercise_library', 'workout_plans', 'routines', 
--     'routine_exercises', 'workout_logs', 'set_logs', 
--     'nutrition_swaps', 'daily_nutrition_logs'
-- )
-- ORDER BY tablename, policyname;

