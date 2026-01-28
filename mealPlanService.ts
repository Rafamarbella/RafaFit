
import { 
    UserFoodItem, WeeklyMealPlan, DailyMealPlan, MealSlot, 
    MacroGoals, BaseFood, PlanItem, FoodCategory, MealPlanSlot,
    SubCategory, NutritionSource, FoodLogItem
} from '../types';
import { foodService } from './foodService';
import { dayStore } from '../data/dayStore';
import { libraryStore } from '../data/libraryStore';
import { createLogItem } from '../utils/nutrition';

const WEEK_KEY_PREFIX = 'rafafit:weeklyPlan:';
const DAILY_KEY_PREFIX = 'rafafit:dailyPlan:';

// --- CONFIGURATION & CONSTANTS ---

const CATEGORY_CONSTRAINTS: Record<FoodCategory, { min: number, max: number, default: number }> = {
    'PROTEINA': { min: 80, max: 250, default: 150 }, 
    'CARBOHIDRATO': { min: 30, max: 300, default: 150 }, 
    'GRASA': { min: 5, max: 30, default: 10 }, 
    'VERDURA': { min: 100, max: 300, default: 150 }, 
    'FRUTA': { min: 80, max: 250, default: 150 },
    'LACTEO': { min: 100, max: 350, default: 200 }, 
    'SNACK': { min: 10, max: 60, default: 30 },
    'SALSAS': { min: 5, max: 20, default: 10 },
    'BEBIDA': { min: 200, max: 500, default: 250 },
    'OTRO': { min: 10, max: 100, default: 50 }
};

// Strict Rules per Slot
const SLOT_RULES: Record<MealSlot, { allowed: SubCategory[], banned: SubCategory[], minItems: number }> = {
    'DESAYUNO': {
        allowed: ['DAIRY', 'FRUIT', 'CARB_BREAKFAST', 'FAT_WHOLE', 'PROTEIN_SOLID' /* Eggs/Ham */, 'PROTEIN_SUPP' /* as extra */],
        banned: ['LEGUME', 'FAT_COOKING' /* oil only as tiny extra */, 'VEG' /* unusual but allowed? let's limit */],
        minItems: 2
    },
    'COMIDA': {
        allowed: ['PROTEIN_SOLID', 'VEG', 'CARB_STARCH', 'LEGUME', 'FAT_COOKING', 'FAT_WHOLE', 'FRUIT'],
        banned: ['PROTEIN_SUPP', 'CARB_BREAKFAST' /* No oats for lunch usually */],
        minItems: 2
    },
    'CENA': {
        allowed: ['PROTEIN_SOLID', 'VEG', 'FAT_COOKING', 'FAT_WHOLE', 'DAIRY'],
        banned: ['PROTEIN_SUPP', 'LEGUME' /* too heavy */, 'CARB_BREAKFAST', 'CARB_STARCH' /* keep light? allow small amount */],
        minItems: 2
    },
    'SNACK': {
        allowed: ['FRUIT', 'DAIRY', 'FAT_WHOLE', 'PROTEIN_SUPP', 'PROTEIN_SOLID'],
        banned: ['LEGUME', 'FAT_COOKING', 'VEG', 'CARB_STARCH'],
        minItems: 1
    }
};

class MealPlanService {
    
    // --- POOL GENERATION ---

    /**
     * Returns a pool of foods ONLY if they are Verified.
     * Merges Core DB + Verified Library Items.
     */
    public getVerifiedPool(): (BaseFood & { subCategory: SubCategory, sourceType: NutritionSource })[] {
        // 1. Core DB items
        const core = foodService.getAllFoods().map(f => ({
            ...f,
            subCategory: this.inferSubCategory(f),
            sourceType: (f.source === 'CORE' ? 'VERIFIED_DB' : 'VERIFIED_USER') as NutritionSource
        }));
        
        // 2. Verified Library Items
        // Convert UserFoodItem (Library) -> BaseFood structure for the generator
        const libraryItems = libraryStore.getVerifiedItems()
            .filter(i => i.macrosPer100) // Double check has macros
            .map(i => ({
                id: i.matchedDbId || i.id, // Prefer DB ID if matched for better deduplication
                displayName: i.name,
                aliases: [i.name.toLowerCase()],
                category: i.category || 'OTRO',
                subCategory: i.subCategory || this.inferSubCategory({ displayName: i.name, category: i.category } as BaseFood),
                kcal100g: i.macrosPer100!.kcal,
                protein100g: i.macrosPer100!.protein,
                carbs100g: i.macrosPer100!.carbs,
                fats100g: i.macrosPer100!.fat,
                source: 'CUSTOM' as const,
                sourceType: 'VERIFIED_USER' as NutritionSource,
                version: 1
            }));

        // Merge, preferring Library verified items if they override DB (though unlikely with random IDs)
        // Deduplicate by display name loosely to avoid having "Pollo" (Core) and "Pollo" (Lib)
        const combined = [...core, ...libraryItems];
        
        // Simple dedupe by name to keep pool clean
        const uniquePool: typeof combined = [];
        const seenNames = new Set<string>();
        
        for (const item of combined) {
            const k = item.displayName.toLowerCase().trim();
            if (!seenNames.has(k)) {
                seenNames.add(k);
                uniquePool.push(item);
            }
        }

        // Exclude items with 0 kcal/macros just in case
        return uniquePool.filter(f => f.kcal100g > 0 || f.protein100g > 0);
    }

    private inferSubCategory(food: BaseFood): SubCategory {
        const name = food.displayName.toLowerCase();
        const cat = food.category;

        if (cat === 'PROTEINA') {
            if (name.includes('whey') || name.includes('batido') || name.includes('caseina') || name.includes('polvo')) return 'PROTEIN_SUPP';
            if (name.includes('lenteja') || name.includes('garbanzo') || name.includes('judia')) return 'LEGUME';
            return 'PROTEIN_SOLID';
        }
        if (cat === 'CARBOHIDRATO') {
            if (name.includes('avena') || name.includes('pan') || name.includes('tostada') || name.includes('cereal')) return 'CARB_BREAKFAST';
            if (name.includes('lenteja') || name.includes('garbanzo')) return 'LEGUME';
            return 'CARB_STARCH';
        }
        if (cat === 'GRASA') {
            if (name.includes('aceite') || name.includes('mantequilla') || name.includes('manteca')) return 'FAT_COOKING';
            return 'FAT_WHOLE'; // Nuts, Avocado
        }
        if (cat === 'LACTEO') return 'DAIRY';
        if (cat === 'FRUTA') return 'FRUIT';
        if (cat === 'VERDURA') return 'VEG';
        
        return 'UNDEFINED';
    }

    // --- CONVERSION LOGIC (PLAN -> LOG) ---

    public convertPlanToLogItems(plan: DailyMealPlan): FoodLogItem[] {
        const logItems: FoodLogItem[] = [];
        const pool = this.getVerifiedPool();

        plan.meals.forEach(meal => {
            meal.items.forEach(pi => {
                // Find source food to ensure we have verified macros
                // First check Core/Pool
                let base: BaseFood | undefined = pool.find(f => f.id === pi.itemId);
                
                // If not in pool (maybe library item was deleted?), try foodService directly
                if (!base) {
                    base = foodService.getFoodById(pi.itemId);
                }

                if (base) {
                    // Create Log Item
                    // Note: PlanItem usually uses 'g'. If units, logic might vary, but standard is 'g' in planner.
                    logItems.push(createLogItem(
                        base, 
                        pi.amount, 
                        meal.slot, 
                        Date.now(), 
                        undefined, 
                        { 
                            consumed: true, 
                            source: 'PLAN_APPLIED' 
                        }
                    ));
                }
            });
        });

        return logItems;
    }

    public markPlanAsApplied(plan: DailyMealPlan) {
        const updatedPlan: DailyMealPlan = { ...plan, status: 'APPLIED' };
        this.saveDailyPlan(updatedPlan);
        return updatedPlan;
    }

    // --- GENERATION ENGINE ---

    public getDailyPlan(date: string): DailyMealPlan | null {
        try {
            const stored = localStorage.getItem(DAILY_KEY_PREFIX + date);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    }

    public saveDailyPlan(plan: DailyMealPlan) {
        localStorage.setItem(DAILY_KEY_PREFIX + plan.date, JSON.stringify(plan));
        dayStore.updateIndexForDay(plan.date);
    }

    public generateDayPlan(date: string, targets: MacroGoals): DailyMealPlan {
        const slotDistribution: Record<MealSlot, number> = {
            'DESAYUNO': 0.25, 'COMIDA': 0.35, 'SNACK': 0.10, 'CENA': 0.30
        };

        const meals: MealPlanSlot[] = [];
        const slots: MealSlot[] = ['DESAYUNO', 'COMIDA', 'SNACK', 'CENA'];

        slots.forEach(slot => {
            const ratio = slotDistribution[slot];
            const slotTargets = {
                calories: targets.calories * ratio,
                protein: targets.protein * ratio,
                carbs: targets.carbs * ratio,
                fats: targets.fats * ratio
            };
            meals.push(this.buildMeal(slot, slotTargets));
        });

        const plan: DailyMealPlan = {
            date,
            meals,
            dayTotals: this.computeDayTotals(meals),
            status: 'DRAFT'
        };
        
        this.saveDailyPlan(plan);
        return plan;
    }

    public regenerateMeal(plan: DailyMealPlan, slotToRegen: MealSlot, dailyTargets: MacroGoals): DailyMealPlan {
        const slotDistribution: Record<MealSlot, number> = {
            'DESAYUNO': 0.25, 'COMIDA': 0.35, 'SNACK': 0.10, 'CENA': 0.30
        };
        const ratio = slotDistribution[slotToRegen];
        const slotTargets = {
            calories: dailyTargets.calories * ratio,
            protein: dailyTargets.protein * ratio,
            carbs: dailyTargets.carbs * ratio,
            fats: dailyTargets.fats * ratio
        };

        const newMeal = this.buildMeal(slotToRegen, slotTargets);
        
        const updatedMeals = plan.meals.map(m => m.slot === slotToRegen ? newMeal : m);
        
        const updatedPlan = {
            ...plan,
            meals: updatedMeals,
            dayTotals: this.computeDayTotals(updatedMeals)
        };
        this.saveDailyPlan(updatedPlan);
        return updatedPlan;
    }

    public swapItem(plan: DailyMealPlan, slot: MealSlot, itemId: string): DailyMealPlan {
        const mealIdx = plan.meals.findIndex(m => m.slot === slot);
        if (mealIdx === -1) return plan;

        const meal = plan.meals[mealIdx];
        const itemIdx = meal.items.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return plan;

        const originalItem = meal.items[itemIdx];
        const subCat = originalItem.subCategory;

        // Find alternatives with SAME subcategory
        const pool = this.getVerifiedPool().filter(f => 
            f.subCategory === subCat && 
            f.id !== originalItem.itemId &&
            this.isAllowedInSlot(f, slot)
        );

        if (pool.length === 0) {
            alert("No hay alternativas directas verificadas para este tipo de alimento.");
            return plan;
        }

        const newItemBase = pool[Math.floor(Math.random() * pool.length)];
        
        // Match logic
        let factor = 1;
        if (newItemBase.category === 'PROTEINA') factor = originalItem.macros.protein / (newItemBase.protein100g || 1);
        else if (newItemBase.category === 'CARBOHIDRATO') factor = originalItem.macros.carbs / (newItemBase.carbs100g || 1);
        else if (newItemBase.category === 'GRASA') factor = originalItem.macros.fat / (newItemBase.fats100g || 1);
        else factor = originalItem.amount / 100;

        let newAmount = factor * 100;
        
        const constraints = CATEGORY_CONSTRAINTS[newItemBase.category];
        newAmount = Math.max(constraints.min, Math.min(constraints.max, newAmount));

        const macros = this.calculateStrictMacros(newItemBase, newAmount);
        const newItem: PlanItem = {
            id: crypto.randomUUID(),
            itemId: newItemBase.id,
            name: newItemBase.displayName,
            category: newItemBase.category,
            subCategory: newItemBase.subCategory,
            amount: Math.round(newAmount),
            unit: 'g',
            macros,
            sourceType: newItemBase.sourceType
        };

        const newItems = [...meal.items];
        newItems[itemIdx] = newItem;
        
        const newMeal = { ...meal, items: newItems, totals: this.computeMealTotals(newItems) };
        const updatedMeals = [...plan.meals];
        updatedMeals[mealIdx] = newMeal;

        const updatedPlan = { ...plan, meals: updatedMeals, dayTotals: this.computeDayTotals(updatedMeals) };
        this.saveDailyPlan(updatedPlan);
        return updatedPlan;
    }

    // --- SOLVER LOGIC ---

    private isAllowedInSlot(food: BaseFood & { subCategory: SubCategory }, slot: MealSlot): boolean {
        const rules = SLOT_RULES[slot];
        if (rules.banned.includes(food.subCategory)) return false;
        return rules.allowed.includes(food.subCategory);
    }

    private buildMeal(slot: MealSlot, targets: MacroGoals): MealPlanSlot {
        const pool = this.getVerifiedPool();
        
        // Define Structure based on Slot
        const structure: SubCategory[] = [];
        
        if (slot === 'DESAYUNO') {
            structure.push(Math.random() > 0.5 ? 'DAIRY' : 'PROTEIN_SOLID');
            structure.push(Math.random() > 0.5 ? 'FRUIT' : 'CARB_BREAKFAST');
            if (Math.random() > 0.7) structure.push('FAT_WHOLE'); 
        } else if (slot === 'COMIDA') {
            structure.push(Math.random() > 0.2 ? 'PROTEIN_SOLID' : 'LEGUME');
            structure.push('VEG');
            if (targets.carbs > 30) structure.push('CARB_STARCH');
            structure.push('FAT_COOKING'); 
        } else if (slot === 'CENA') {
            structure.push('PROTEIN_SOLID');
            structure.push('VEG');
            structure.push('FAT_COOKING');
        } else {
            structure.push(Math.random() > 0.5 ? 'FRUIT' : 'DAIRY');
        }

        const items: PlanItem[] = [];

        // Fill Structure
        for (const subCat of structure) {
            const candidates = pool.filter(f => f.subCategory === subCat && this.isAllowedInSlot(f, slot));
            if (candidates.length === 0) continue;

            const selected = candidates[Math.floor(Math.random() * candidates.length)];
            
            let amount = CATEGORY_CONSTRAINTS[selected.category].default;
            if (subCat === 'FAT_COOKING') amount = 10; 

            const macros = this.calculateStrictMacros(selected, amount);

            items.push({
                id: crypto.randomUUID(),
                itemId: selected.id,
                name: selected.displayName,
                category: selected.category,
                subCategory: selected.subCategory,
                amount: amount,
                unit: 'g',
                macros,
                sourceType: selected.sourceType
            });
        }

        // Adjust Quantities
        items.forEach(item => {
            const constraints = CATEGORY_CONSTRAINTS[item.category];
            const baseFood = pool.find(f => f.id === item.itemId);
            if (!baseFood) return;

            let newAmount = item.amount;

            if (item.category === 'PROTEINA') {
                const targetP = targets.protein * (slot === 'SNACK' ? 1.0 : 0.8);
                newAmount = (targetP / baseFood.protein100g) * 100;
            } else if (item.category === 'CARBOHIDRATO' || item.category === 'FRUTA') {
                const carbItems = items.filter(i => i.category === 'CARBOHIDRATO' || i.category === 'FRUTA').length;
                const targetC = (targets.carbs / (carbItems || 1)); 
                newAmount = (targetC / baseFood.carbs100g) * 100;
            } else if (item.subCategory === 'FAT_COOKING') {
                newAmount = 10;
            } else if (item.category === 'GRASA') {
                const targetF = targets.fats * 0.5;
                newAmount = (targetF / baseFood.fats100g) * 100;
            }

            newAmount = Math.max(constraints.min, Math.min(constraints.max, newAmount));
            if (item.subCategory === 'FAT_COOKING') newAmount = Math.min(15, Math.max(5, newAmount));

            item.amount = Math.round(newAmount);
            item.macros = this.calculateStrictMacros(baseFood, newAmount);
        });

        return { slot, items, totals: this.computeMealTotals(items) };
    }

    private calculateStrictMacros(food: BaseFood, grams: number) {
        const factor = grams / 100;
        const p = food.protein100g * factor;
        const c = food.carbs100g * factor;
        const f = food.fats100g * factor;
        const kcal = (p * 4) + (c * 4) + (f * 9);
        
        return {
            kcal: Math.round(kcal),
            protein: parseFloat(p.toFixed(1)),
            carbs: parseFloat(c.toFixed(1)),
            fat: parseFloat(f.toFixed(1))
        };
    }

    private computeMealTotals(items: PlanItem[]) {
        return items.reduce((acc, i) => ({
            kcal: acc.kcal + i.macros.kcal,
            protein: acc.protein + i.macros.protein,
            carbs: acc.carbs + i.macros.carbs,
            fat: acc.fat + i.macros.fat
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    }

    private computeDayTotals(meals: MealPlanSlot[]) {
        return meals.reduce((acc, m) => ({
            kcal: acc.kcal + m.totals.kcal,
            protein: acc.protein + m.totals.protein,
            carbs: acc.carbs + m.totals.carbs,
            fat: acc.fat + m.totals.fat
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    }
}

export const mealPlanService = new MealPlanService();
