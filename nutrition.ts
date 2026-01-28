
import { BaseFood, FoodLogItem, DayData, MealSlot, MacroGoals, ParsedFood } from '../types';
import { foodService } from '../services/foodService';
import { UNIT_CONVERSIONS } from '../data/unitConversions';
import { dayService } from '../services/dayService';

export const MEAL_SLOTS: MealSlot[] = ['DESAYUNO', 'COMIDA', 'SNACK', 'CENA'];

export const normalizeFoodName = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^a-z0-9-]/g, ''); 
};

export const calculateMacros = (base: BaseFood, grams: number) => {
  const factor = grams / 100;
  return {
    calories: Math.round(base.kcal100g * factor),
    protein: Number((base.protein100g * factor).toFixed(1)),
    carbs: Number((base.carbs100g * factor).toFixed(1)),
    fats: Number((base.fats100g * factor).toFixed(1))
  };
};

export const createLogItem = (
  base: BaseFood, 
  grams: number, 
  slot: MealSlot = 'COMIDA',
  timestamp = Date.now(), 
  imageUrl?: string,
  extra: { isEstimated?: boolean; unitCount?: number; unitLabel?: string; consumed?: boolean; source?: 'PLAN_APPLIED' | 'MANUAL' } = {}
): FoodLogItem => {
  const macros = calculateMacros(base, grams);
  return {
    id: crypto.randomUUID(),
    foodId: base.id,
    name: base.displayName,
    grams: grams,
    slot,
    ...macros,
    timestamp,
    imageUrl,
    consumed: extra.consumed !== undefined ? extra.consumed : true, // Default to true unless specified
    ...extra
  };
};

export const validateDailyLog = (log: any): DayData => {
  // Ensure basic structure and DayData properties exist
  const date = log?.date || new Date().toISOString().split('T')[0];
  const structuredLog = dayService.validateLogStructure(log, date);

  if (!structuredLog.nutrition.meals || !Array.isArray(structuredLog.nutrition.meals)) {
     return { ...structuredLog, nutrition: { ...structuredLog.nutrition, meals: [] } };
  }

  let hasChanges = false;
  const validatedMeals = structuredLog.nutrition.meals.map(meal => {
    if (!meal.slot) { hasChanges = true; meal.slot = 'COMIDA'; }
    // Fetch latest data from service to ensure consistency
    const base = foodService.getFoodById(meal.foodId);
    if (!base) return meal; 
    
    // Re-calculate macros to ensure data integrity
    const expected = calculateMacros(base, meal.grams);
    const isConsistent = 
      Math.abs(expected.calories - meal.calories) <= 1 &&
      Math.abs(expected.protein - meal.protein) <= 0.5 &&
      Math.abs(expected.carbs - meal.carbs) <= 0.5 &&
      Math.abs(expected.fats - meal.fats) <= 0.5;
    
    if (!isConsistent) { hasChanges = true; return { ...meal, ...expected }; }
    return meal;
  });
  
  return hasChanges 
    ? { ...structuredLog, nutrition: { ...structuredLog.nutrition, meals: validatedMeals } } 
    : structuredLog;
};

// --- ADVANCED CALCULATIONS ---

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    'SEDENTARY': 1.2,
    'LIGHT': 1.375,   // 1-3 days/week
    'MODERATE': 1.55, // 3-5 days/week
    'ACTIVE': 1.725,  // 6-7 days/week
    'VERY_ACTIVE': 1.9
};

/**
 * Calculates TDEE using Mifflin-St Jeor Formula
 */
export const calculateTDEE = (weightKg: number, heightCm: number, age: number, activity: ActivityLevel, gender: 'M' | 'F' = 'M'): number => {
    // BMR Calculation
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr += (gender === 'M' ? 5 : -161);

    // TDEE
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
};

/**
 * Calculates Target Macros based on Goal and Constraints
 * @param customDeficitDecimal Optional manual override (e.g. 0.25 for 25%). If provided, it overrides the default goal logic.
 */
export const calculateTargetMacros = (
    tdee: number, 
    weightKg: number, 
    goal: 'LOSE' | 'MAINTAIN' | 'GAIN',
    customDeficitDecimal?: number
): { targets: MacroGoals, deficitPct: number, reason: string } => {
    
    let targetKcal = tdee;
    let proteinPerKg = 1.8;
    let deficitPct = 0;
    let reason = "Mantenimiento";

    // 1. Determine Calories
    if (customDeficitDecimal !== undefined) {
        // Manual Override
        deficitPct = customDeficitDecimal;
        // Invert calculation for Gain (negative deficit)
        targetKcal = tdee * (1 - deficitPct);
        
        if (deficitPct > 0) {
            proteinPerKg = 2.0;
            reason = `Déficit Manual (${Math.round(deficitPct * 100)}%)`;
        } else if (deficitPct < 0) {
            proteinPerKg = 1.8;
            reason = `Superávit Manual (${Math.round(Math.abs(deficitPct) * 100)}%)`;
        } else {
            reason = "Mantenimiento (Manual)";
        }

    } else {
        // Default Logic
        if (goal === 'LOSE') {
            deficitPct = 0.20; // 20% Standard Deficit
            targetKcal = tdee * (1 - deficitPct);
            proteinPerKg = 2.0; // Higher protein in deficit to spare muscle
            reason = "Déficit 20% (Pérdida Grasa)";
        } else if (goal === 'GAIN') {
            deficitPct = -0.10; // Surplus
            targetKcal = tdee * 1.10;
            proteinPerKg = 1.8;
            reason = "Superávit 10% (Ganancia)";
        }
    }

    // Safety Floor (Hard limit for Rafa's profile size)
    const MIN_SAFE = 1600;
    if (targetKcal < MIN_SAFE) {
        targetKcal = MIN_SAFE;
        reason = "Ajustado al mínimo seguro (1600kcal)";
        deficitPct = 1 - (targetKcal / tdee);
    }

    // 2. Distribute Macros
    const proteinGrams = Math.min(Math.round(weightKg * proteinPerKg), 250); // Cap protein at 250g
    const proteinKcal = proteinGrams * 4;

    // Fats: 25-30% of Total Calories
    const fatPct = 0.30;
    const fatKcal = targetKcal * fatPct;
    const fatGrams = Math.round(fatKcal / 9);

    // Carbs: Remainder
    let carbKcal = targetKcal - proteinKcal - fatKcal;
    if (carbKcal < 0) { 
        carbKcal = 0; 
        // Adjust total if math broke due to high protein constraint
        targetKcal = proteinKcal + fatKcal; 
    }
    const carbGrams = Math.round(carbKcal / 4);

    const round5 = (n: number) => Math.round(n / 5) * 5;

    return {
        targets: {
            calories: round5(targetKcal),
            protein: round5(proteinGrams),
            fats: round5(fatGrams),
            carbs: round5(carbGrams)
        },
        deficitPct: Math.round(deficitPct * 100),
        reason
    };
};

export const calculateAutoMacros = (currentWeightKg: number): MacroGoals => {
    // Fallback simple calculator used by legacy code, upgraded to assume Moderate Activity + Deficit
    const tdee = calculateTDEE(currentWeightKg, 175, 40, 'MODERATE', 'M'); // Defaults
    return calculateTargetMacros(tdee, currentWeightKg, 'LOSE').targets;
};

// --- GLOBAL PARSER LOGIC ---

/**
 * PARSE SMART INPUT (PRIORITY ORDER):
 * 1. Explicit Grams ("200g") -> EXACT
 * 2. Number + Alias ("2 huevos") -> ESTIMATED (Auto)
 * 3. Implicit Singular ("platano") -> ESTIMATED (1 unit Auto)
 * 4. Implicit Plural ("huevos") -> UNKNOWN (Ask units)
 * 5. No match -> UNKNOWN (Ask units or grams)
 */
export const parseSmartInput = (input: string): ParsedFood => {
  const lower = input.toLowerCase().trim();
  
  // 1. Check for EXPLICIT GRAMS
  const gramsRegex = /(\d+(?:[\.,]\d+)?)\s*(?:g|gr|gramos|gramo|kg|kilo)\b/i;
  const gramsMatch = lower.match(gramsRegex);
  
  if (gramsMatch) {
    let val = parseFloat(gramsMatch[1].replace(',', '.'));
    if (lower.includes('kg') || lower.includes('kilo')) val *= 1000;
    
    const cleanName = lower.replace(gramsMatch[0], '').trim();
    // Search DB for name
    const results = foodService.searchFoods(cleanName, 1);
    const foodId = results.length > 0 ? results[0].food.id : null;

    return { 
        foodId, 
        foodNameRaw: cleanName, 
        quantity: { type: 'EXACT', grams: val } 
    };
  }

  // 2. Check for QUANTITY (Number) at start
  const numberRegex = /^(\d+(?:[\.,]\d+)?)\s+(.+)$/; 
  const numMatch = lower.match(numberRegex);
  
  let quantity: number | null = null;
  let remainingText = lower;

  if (numMatch) {
      quantity = parseFloat(numMatch[1].replace(',', '.'));
      remainingText = numMatch[2].trim();
  }

  // 3. Search in UNIT_CONVERSIONS (Alias Matching)
  let bestConvMatch = null;
  let bestAliasLen = 0;

  for (const conv of UNIT_CONVERSIONS) {
      for (const alias of conv.aliases) {
          const checkText = quantity !== null ? remainingText : lower;
          if (checkText === alias || checkText.includes(alias)) {
              if (alias.length > bestAliasLen) {
                  bestConvMatch = { conv, alias };
                  bestAliasLen = alias.length;
              }
          }
      }
  }

  // Determine Food ID:
  let foodId: string | null = null;
  
  if (bestConvMatch) {
      const searchText = quantity !== null ? remainingText : lower;
      const searchRes = foodService.searchFoods(searchText, 1);
      if (searchRes.length > 0) foodId = searchRes[0].food.id;
      
      const { conv } = bestConvMatch;

      // Case A: Quantity exists
      if (quantity !== null) {
          return {
              foodId,
              foodNameRaw: remainingText,
              quantity: {
                  type: 'ESTIMATED',
                  grams: quantity * conv.grams,
                  unitCount: quantity,
                  unitLabel: conv.label
              }
          };
      }

      // Case B: No Quantity
      if (conv.defaultIfNoNumber) {
           return {
              foodId,
              foodNameRaw: lower,
              quantity: {
                  type: 'ESTIMATED',
                  grams: conv.grams * 1,
                  unitCount: 1,
                  unitLabel: conv.label
              }
          };
      }

      if (conv.askUnitsIfPluralNoNumber) {
           return {
              foodId,
              foodNameRaw: lower,
              quantity: { type: 'UNKNOWN', grams: 0 } 
          };
      }
  }

  // 4. No Conversion Match -> Fallback Search
  const searchRes = foodService.searchFoods(lower, 1);
  foodId = searchRes.length > 0 ? searchRes[0].food.id : null;
  
  return { 
      foodId, 
      foodNameRaw: lower, 
      quantity: { type: 'UNKNOWN', grams: 0 } 
  };
};
