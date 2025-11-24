import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============= VALIDATION =============
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates body weight input
 * @param weight - The weight value to validate
 * @returns ValidationResult with isValid flag and error message if invalid
 */
export function validateBodyWeight(weight: number): ValidationResult {
  if (isNaN(weight)) {
    return { isValid: false, error: 'אנא הזן משקל תקין (מספר חיובי)' };
  }

  if (weight <= 0) {
    return { isValid: false, error: 'אנא הזן משקל תקין (מספר חיובי)' };
  }

  if (weight > 500) {
    return { isValid: false, error: 'המשקל שהוזן לא סביר. אנא בדוק את הערך.' };
  }

  return { isValid: true, error: null };
}
