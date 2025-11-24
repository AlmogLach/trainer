// Nutrition targets configuration
// These values can be loaded from the database in the future
// For now, they are defined as constants but can be customized per trainee

export interface NutritionTargets {
  fluids: number; // ml
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  calories: number; // kcal
}

// Default nutrition targets
export const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  fluids: 3000, // ml
  protein: 200, // grams
  fat: 100, // grams
  carbs: 300, // grams
  calories: 3000, // kcal
};

/**
 * Get nutrition targets for a trainee
 * In the future, this can fetch from the database based on trainee's plan
 */
export function getNutritionTargets(traineeId?: string): NutritionTargets {
  // TODO: Load from database based on trainee's nutrition menu or workout plan
  // For now, return defaults
  return DEFAULT_NUTRITION_TARGETS;
}

