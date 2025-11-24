-- Migration: Add Complete Nutrition Swaps Database
-- This script adds all the food swaps based on the conversion table provided

-- First, ensure we have a unique constraint on food_name (if not exists)
-- This allows us to use ON CONFLICT to update existing records
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'nutrition_swaps_food_name_key'
    ) THEN
        ALTER TABLE nutrition_swaps ADD CONSTRAINT nutrition_swaps_food_name_key UNIQUE (food_name);
    END IF;
END $$;

-- Optional: Clear existing data (uncomment if you want to start fresh)
-- DELETE FROM nutrition_swaps;

-- ============================================
-- 🍚 CARBS (פחמימות)
-- ============================================

-- Base: אורז לבן מבושל (ערכים מדויקים מ-FoodsDictionary: 130-163 cal, 2.2-2.8g protein, 23-30g carbs, 0.3g fat)
-- ממוצע: 130 cal, 2.5g protein, 25g carbs, 0.3g fat
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) 
VALUES ('אורז לבן מבושל', 'carbs', 1.0, 2.5, 25.0, 0.3, 130)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- פסטה / פתיתים / ספגטי מבושלים (conversion: 0.8 from rice)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('פסטה מבושלת', 'carbs', 0.8, 5.0, 25.0, 0.9, 131),
('פתיתים מבושלים', 'carbs', 0.8, 5.0, 25.0, 0.9, 131),
('ספגטי מבושל', 'carbs', 0.8, 5.0, 25.0, 0.9, 131)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- תפוח אדמה / בטטה / כוסמת / בורגול מבושלים (conversion: 1.33 from rice)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('תפוח אדמה מבושל', 'carbs', 1.33, 1.6, 20.1, 0.1, 86),
('בטטה מבושלת', 'carbs', 1.33, 1.6, 20.1, 0.1, 86),
('כוסמת מבושלת', 'carbs', 1.33, 3.4, 19.9, 0.6, 92),
('בורגול מבושל', 'carbs', 1.33, 3.1, 18.6, 0.2, 83)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- קוסקוס / קינואה / עדשים מבושלים (same weight as rice)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('קוסקוס מבושל', 'carbs', 1.0, 3.8, 23.2, 0.2, 112),
('קינואה מבושלת', 'carbs', 1.0, 4.4, 21.3, 1.9, 120),
('עדשים מבושלים', 'carbs', 1.0, 9.0, 20.1, 0.4, 116)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- ============================================
-- 🍗 PROTEIN (חלבון)
-- ============================================

-- פרגית מבושלת (base for protein swaps)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('פרגית מבושלת', 'protein', 1.0, 27.0, 0.0, 5.0, 165)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- חזה עוף / הודו (ערכים מדויקים מ-FoodsDictionary: 151 cal, 28.98g protein, 3.03g fat)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('חזה עוף מבושל', 'protein', 1.0, 29.0, 0.0, 3.0, 151),
('חזה הודו מבושל', 'protein', 1.0, 29.0, 0.0, 3.0, 150),
('הודו מבושל', 'protein', 1.0, 29.0, 0.0, 3.0, 150)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- דגים (varies by type)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('דג לבן מבושל', 'protein', 1.0, 24.0, 0.0, 1.0, 110),
('סלמון מבושל', 'protein', 1.0, 25.0, 0.0, 12.0, 206),
('טונה בשמן (מסונן)', 'protein', 1.0, 25.0, 0.0, 8.0, 190),
('טונה במים (מסונן)', 'protein', 1.0, 25.0, 0.0, 0.5, 110)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- בשר בקר (varies by fat content)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('בשר בקר רזה מבושל', 'protein', 1.0, 26.0, 0.0, 8.0, 180),
('בשר בקר שומני מבושל', 'protein', 1.0, 24.0, 0.0, 18.0, 250)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- מוצרי חלב וחלבון
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('קוטג'' 3%', 'protein', 1.5, 11.0, 3.4, 3.0, 98),
('קוטג'' 5%', 'protein', 1.5, 11.0, 3.4, 5.0, 120),
('גבינה צהובה 9%', 'protein', 1.0, 25.0, 0.0, 9.0, 200),
('גבינה בולגרית 5%', 'protein', 1.0, 20.0, 0.0, 5.0, 130),
('גבינה צפתית 5%', 'protein', 1.0, 20.0, 0.0, 5.0, 130),
('פסטרמה רזה (עד 4% שומן)', 'protein', 1.0, 18.0, 1.0, 4.0, 120),
('ביצה', 'protein', 0.5, 13.0, 1.1, 11.0, 155),
('אבקת חלבון (33 גרם)', 'protein', 0.33, 25.0, 3.0, 1.0, 130),
('יוגורט 20 גרם חלבון', 'protein', 1.0, 10.0, 4.0, 0.0, 60),
('חטיף חלבון 20g', 'protein', 1.0, 20.0, 15.0, 5.0, 180)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- ============================================
-- 🥑 FAT (שומן - מנת שומן יומית)
-- ============================================

-- Base: 25 גרם טחינה שוקולד אחווה (approx 150 cal, 6g fat)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('טחינה שוקולד אחווה', 'fat', 1.0, 3.0, 20.0, 25.0, 280)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- אגוזים / שקדים / בוטנים / קשיו / פקאן (20g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('אגוזים', 'fat', 0.8, 15.0, 10.0, 65.0, 650),
('שקדים', 'fat', 0.8, 21.0, 12.0, 50.0, 580),
('בוטנים', 'fat', 0.8, 26.0, 16.0, 49.0, 567),
('קשיו', 'fat', 0.8, 18.0, 30.0, 44.0, 553),
('פקאן', 'fat', 0.8, 9.0, 14.0, 72.0, 691)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- חמאת בוטנים טבעית (20g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('חמאת בוטנים טבעית', 'fat', 0.8, 25.0, 20.0, 50.0, 588)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- זיתים (70g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('זיתים', 'fat', 2.8, 1.0, 3.0, 11.0, 115)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- אבוקדו (70g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('אבוקדו', 'fat', 2.8, 2.0, 9.0, 15.0, 160)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- שמן זית (1 כף = 15ml = ~13.5g)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('שמן זית', 'fat', 0.54, 0.0, 0.0, 100.0, 884)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- טחינה גולמית (1 כף = 15g)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('טחינה גולמית', 'fat', 0.6, 17.0, 21.0, 54.0, 595)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- חומוס (1 כף = 42g)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('חומוס', 'fat', 1.68, 8.0, 14.0, 10.0, 166)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- במבה (25g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('במבה', 'fat', 1.0, 8.0, 50.0, 30.0, 500)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- שוקולד מריר (20g = 25g tahini)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('שוקולד מריר', 'fat', 0.8, 7.0, 45.0, 43.0, 546)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- ============================================
-- 🥖 BREAD / PITAS (לחם / פיתות)
-- ============================================

-- Base: פיתה רגילה (100g = 240 cal)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('פיתה רגילה', 'bread', 1.0, 8.0, 50.0, 1.0, 240)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- לחם לבן (80 cal per slice, ~30g per slice)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('פרוסת לחם לבן', 'bread', 0.33, 8.0, 50.0, 1.0, 267),
('לחמנייה (75 גרם)', 'bread', 0.75, 8.0, 50.0, 1.0, 267),
('פריכייה', 'bread', 0.125, 8.0, 80.0, 0.5, 400),
('חלה (100 גרם)', 'bread', 1.18, 8.0, 50.0, 4.0, 283)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- אורז לבן מבושל (100g = 120 cal) - for bread conversion
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('אורז לבן מבושל (כוס 180cc)', 'bread', 0.5, 2.7, 28.2, 0.3, 130)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- ============================================
-- Additional common foods
-- ============================================

-- שיבולת שועל (already exists but adding for completeness)
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('שיבולת שועל', 'carbs', 0.7, 13.2, 55.7, 6.5, 379)
ON CONFLICT (food_name) DO UPDATE SET
  conversion_factor = EXCLUDED.conversion_factor,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  calories_per_100g = EXCLUDED.calories_per_100g;

-- Note: The conversion_factor is relative to the base food in each category
-- For carbs: base is אורז לבן (1.0)
-- For protein: base is פרגית (1.0) 
-- For fat: base is טחינה שוקולד (1.0)
-- For bread: base is פיתה (1.0)

