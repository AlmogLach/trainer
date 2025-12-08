import { supabase } from '../supabase';
import type { NutritionMenu, DailyNutritionLog } from '../types';
import { handleDatabaseError, DatabaseError } from './errors';
import { getActiveWorkoutPlan } from './workouts';

// ============= NUTRITION MENU =============
export async function getNutritionMenu(traineeId: string): Promise<NutritionMenu | null> {
  const plan = await getActiveWorkoutPlan(traineeId);
  if (!plan) return null;

  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('nutrition_menu')
      .eq('id', plan.id)
      .maybeSingle();

    if (error) {
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column')) {
        console.warn('nutrition_menu column does not exist yet. Run the migration to add it.');
        return null;
      }
      throw error;
    }
    return (data?.nutrition_menu as NutritionMenu) || null;
  } catch (err: any) {
    if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('column')) {
      return null;
    }
    throw err;
  }
}

export async function updateNutritionMenu(traineeId: string, menu: NutritionMenu): Promise<void> {
  const plan = await getActiveWorkoutPlan(traineeId);
  if (!plan) throw new Error('No active workout plan found');

  const { error } = await supabase
    .from('workout_plans')
    .update({ nutrition_menu: menu as any })
    .eq('id', plan.id);

  if (error) {
    if (error.code === '42703' || error.message?.includes('column')) {
      throw new Error('nutrition_menu column does not exist. Please run the migration to add it first.');
    }
    throw error;
  }
}

// ============= DAILY NUTRITION LOGS =============
export async function getDailyNutritionLog(traineeId: string, date?: string): Promise<DailyNutritionLog | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_nutrition_logs')
    .select('*')
    .eq('user_id', traineeId)
    .eq('date', targetDate)
    .maybeSingle();

  if (error) {
    if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('relation')) {
      console.warn('daily_nutrition_logs table does not exist yet.');
      return null;
    }
    throw error;
  }
  
  return data || null;
}

export async function upsertDailyNutritionLog(
  traineeId: string,
  date: string,
  updates: {
    total_protein?: number | null;
    total_carbs?: number | null;
    total_fat?: number | null;
    total_calories?: number | null;
    notes?: string | null;
  }
): Promise<DailyNutritionLog> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const existing = await getDailyNutritionLog(traineeId, targetDate);
  
  if (existing) {
    const { data, error } = await supabase
      .from('daily_nutrition_logs')
      .update({
        total_protein: updates.total_protein ?? existing.total_protein,
        total_carbs: updates.total_carbs ?? existing.total_carbs,
        total_fat: updates.total_fat ?? existing.total_fat,
        total_calories: updates.total_calories ?? existing.total_calories,
        notes: updates.notes ?? existing.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('relation')) {
        throw new DatabaseError('daily_nutrition_logs table does not exist. Please run the migration.', error);
      }
      throw error;
    }
    
    return data;
  } else {
    const { data, error } = await supabase
      .from('daily_nutrition_logs')
      .insert({
        user_id: traineeId,
        date: targetDate,
        total_protein: updates.total_protein ?? null,
        total_carbs: updates.total_carbs ?? null,
        total_fat: updates.total_fat ?? null,
        total_calories: updates.total_calories ?? null,
        notes: updates.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('relation')) {
        throw new DatabaseError('daily_nutrition_logs table does not exist. Please run the migration.', error);
      }
      throw error;
    }
    
    return data;
  }
}

export async function addToDailyNutritionLog(
  traineeId: string,
  date: string,
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  }
): Promise<DailyNutritionLog> {
  const existing = await getDailyNutritionLog(traineeId, date);
  
  const newTotals = {
    total_protein: (existing?.total_protein || 0) + macros.protein,
    total_carbs: (existing?.total_carbs || 0) + macros.carbs,
    total_fat: (existing?.total_fat || 0) + macros.fat,
    total_calories: (existing?.total_calories || 0) + macros.calories,
  };
  
  return upsertDailyNutritionLog(traineeId, date, newTotals);
}

// ============= NUTRITION SWAPS =============
export async function getNutritionSwaps() {
  try {
    const { data, error } = await supabase
      .from('nutrition_swaps')
      .select('*')
      .order('food_name', { ascending: true });

    if (error) {
      console.error('Error fetching nutrition swaps:', error);
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        throw new DatabaseError(
          'RLS policy issue: Please ensure nutrition_swaps read policy exists. Run secure-rls-policies.sql',
          error,
          error.code
        );
      }
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new DatabaseError(
          'nutrition_swaps table does not exist. Please run the migration to create it.',
          error,
          error.code
        );
      }
      throw error;
    }
    
    console.log(`Loaded ${data?.length || 0} nutrition swaps from database`);
    return data || [];
  } catch (err: any) {
    console.error('getNutritionSwaps error:', err);
    throw err;
  }
}

// ============= FOOD HISTORY =============
export interface FoodHistoryItem {
  foodName: string;
  amount: string;
  lastUsed?: string;
}

export async function getDailyNutritionLogsForUsers(
  traineeIds: string[],
  startDate?: string
): Promise<Map<string, DailyNutritionLog[]>> {
  if (traineeIds.length === 0) {
    return new Map();
  }

  let query = supabase
    .from('daily_nutrition_logs')
    .select('*')
    .in('user_id', traineeIds)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('relation')) {
      console.warn('daily_nutrition_logs table does not exist yet.');
      return new Map();
    }
    throw error;
  }

  // Group by user_id
  const logsMap = new Map<string, DailyNutritionLog[]>();
  traineeIds.forEach(id => logsMap.set(id, []));

  (data || []).forEach(log => {
    const existing = logsMap.get(log.user_id) || [];
    logsMap.set(log.user_id, [...existing, log]);
  });

  return logsMap;
}

export async function getFoodHistory(traineeId: string): Promise<FoodHistoryItem[]> {
  try {
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('id, nutrition_menu, updated_at, is_active')
      .eq('trainee_id', traineeId)
      .not('nutrition_menu', 'is', null)
      .order('updated_at', { ascending: false });

    if (plansError) {
      if (plansError.code === '42703' || plansError.message?.includes('column')) {
        return [];
      }
      throw plansError;
    }

    if (!plans || plans.length === 0) {
      return [];
    }

    const foodMap = new Map<string, { amount: string; lastUsed: string }>();

    plans.forEach(plan => {
      const menu = plan.nutrition_menu as NutritionMenu | null;
      if (menu && menu.meals) {
        menu.meals.forEach(meal => {
          if (meal.foods) {
            meal.foods.forEach(food => {
              if (food.foodName && food.foodName.trim()) {
                const existing = foodMap.get(food.foodName.trim());
                const planDate = plan.updated_at || plan.id;
                
                if (!existing || (plan.updated_at && existing.lastUsed < plan.updated_at)) {
                  foodMap.set(food.foodName.trim(), {
                    amount: food.amount || '',
                    lastUsed: plan.updated_at || planDate
                  });
                }
              }
            });
          }
        });
      }
    });

    const foodHistory: FoodHistoryItem[] = Array.from(foodMap.entries())
      .map(([foodName, data]) => ({
        foodName,
        amount: data.amount,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });

    return foodHistory;
  } catch (err: any) {
    if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('column')) {
      return [];
    }
    throw err;
  }
}



