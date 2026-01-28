
import { WeightEntry, MacroGoals, MacroSettings } from '../types';

const MIN_SAFE_CALORIES = 1700;
const CHECK_INTERVAL_DAYS = 7; // Only adjust if last check was > 7 days ago

// Targets per kg of bodyweight
const PROTEIN_PER_KG = 2.0; 
const FAT_PER_KG = 0.8;

export interface AdjustmentResult {
    shouldUpdate: boolean;
    newMacros: MacroGoals | null;
    reason: string | null;
}

class AdjustmentService {

    /**
     * Main function to evaluate if an adjustment is needed.
     */
    public evaluateProgress(
        currentWeight: number,
        weightHistory: WeightEntry[],
        currentSettings: MacroSettings
    ): AdjustmentResult {
        
        // 1. Check if Auto Mode is ON
        if (currentSettings.mode !== 'AUTO') {
            return { shouldUpdate: false, newMacros: null, reason: "Modo manual activo" };
        }

        // 2. Check Frequency (Don't adjust too often)
        const lastUpdated = currentSettings.lastUpdated || 0;
        const daysSinceLastUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastUpdate < CHECK_INTERVAL_DAYS) {
            return { shouldUpdate: false, newMacros: null, reason: `Revisión programada en ${Math.ceil(CHECK_INTERVAL_DAYS - daysSinceLastUpdate)} días` };
        }

        // 3. Find Comparison Weight (Approx 7 days ago)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoISO = oneWeekAgo.toISOString().split('T')[0];

        // Sort history descending (newest first)
        const sortedHistory = [...weightHistory].sort((a, b) => b.date.localeCompare(a.date));
        
        // Find entry closest to 7 days ago (within reasonable window, e.g., 5-9 days ago)
        const pastEntry = sortedHistory.find(entry => {
            const entryDate = new Date(entry.date);
            const diffDays = Math.abs((oneWeekAgo.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 2; // Tolerance +/- 2 days around the 7 day mark
        });

        if (!pastEntry) {
            return { shouldUpdate: false, newMacros: null, reason: "Faltan datos de peso de hace una semana" };
        }

        // 4. Calculate Change
        const weightDiff = currentWeight - pastEntry.weight; // Negative means loss
        const percentChange = (weightDiff / pastEntry.weight) * 100;
        
        // 5. Apply Logic
        let kcalAdjustment = 0;
        let reason = "";

        if (percentChange > -0.25) {
            // Stalled or Gained (Loss < 0.25% or Gain)
            kcalAdjustment = -200;
            reason = `Pérdida lenta (${percentChange.toFixed(2)}%). Reduciendo kcal.`;
        } else if (percentChange < -1.0) {
            // Losing too fast (Loss > 1%)
            kcalAdjustment = +150;
            reason = `Pérdida rápida (${percentChange.toFixed(2)}%). Aumentando kcal para proteger músculo.`;
        } else {
            // Sweet spot (0.25% - 1.0% loss)
            // Recalculate base macros for new weight, but keep caloric deficit steady relative to TDEE?
            // Actually, usually in sweet spot we change nothing or just realign protein to current weight.
            // Let's recalculate structure but keep approximate calories similar unless weight dropped significantly.
            kcalAdjustment = 0;
            reason = "Ritmo óptimo. Manteniendo calorías, actualizando macros al nuevo peso.";
        }

        // 6. Calculate New Targets
        const currentKcal = currentSettings.targets.calories;
        let newKcal = currentKcal + kcalAdjustment;

        // Safety Floor
        if (newKcal < MIN_SAFE_CALORIES) {
            newKcal = MIN_SAFE_CALORIES;
            reason += " (Límite de seguridad alcanzado)";
        }

        const newMacros = this.distributeMacros(newKcal, currentWeight);

        // Check if significant change actually occurred (avoid micro updates)
        const isDifferent = 
            Math.abs(newMacros.calories - currentSettings.targets.calories) > 20 ||
            Math.abs(newMacros.protein - currentSettings.targets.protein) > 5;

        if (!isDifferent) {
             return { shouldUpdate: false, newMacros: null, reason: "Cambios insignificantes" };
        }

        return { shouldUpdate: true, newMacros, reason };
    }

    /**
     * Recalculates P/F/C split based on Total Calories and Bodyweight.
     */
    private distributeMacros(kcal: number, bodyWeight: number): MacroGoals {
        // 1. Protein: Fixed by bodyweight (Protects muscle in deficit)
        const proteinGrams = Math.round(bodyWeight * PROTEIN_PER_KG);
        const proteinKcal = proteinGrams * 4;

        // 2. Fats: Minimum health requirement
        const fatGrams = Math.round(bodyWeight * FAT_PER_KG);
        const fatKcal = fatGrams * 9;

        // 3. Carbs: Fill the rest
        let remainingKcal = kcal - proteinKcal - fatKcal;
        
        // Safety check if remaining is negative (unlikely with 1700 floor but possible with very high weight)
        if (remainingKcal < 0) {
            // Compress fats slightly first
            remainingKcal = 0; 
            // Re-adjust total kcal to match sum if math broke
        }

        const carbGrams = Math.floor(remainingKcal / 4);

        // Final round to ensure sum equals target
        const total = (proteinGrams * 4) + (fatGrams * 9) + (carbGrams * 4);

        return {
            calories: total,
            protein: proteinGrams,
            fats: fatGrams,
            carbs: carbGrams
        };
    }
}

export const adjustmentService = new AdjustmentService();
