
import { DayData, UserProfile, RangeStats, WeightEntry, DaySummary } from '../types';
import { dayStore } from '../data/dayStore';

const DAY_KEY_PREFIX = 'rafafit:day:';

class StatsService {

    /**
     * Calculates statistics for a given date range.
     * Optimized to only load necessary days from localStorage.
     */
    public calculateStats(
        fromDate: string, 
        toDate: string, 
        user: UserProfile
    ): RangeStats {
        const dateRange = this.getDatesInRange(fromDate, toDate);
        const dayIndex = dayStore.getDayIndex();
        
        // 1. Load relevant DayData
        const loadedDays: Record<string, DayData | null> = {};
        
        dateRange.forEach(date => {
            // Only load if index says it has something relevant (Nutrition, Training, Weight)
            const summary = dayIndex[date];
            if (summary && (summary.hasNutrition || summary.hasTraining || summary.hasWeight || !summary.isOpen)) {
                try {
                    const raw = localStorage.getItem(`${DAY_KEY_PREFIX}${date}`);
                    if (raw) loadedDays[date] = JSON.parse(raw);
                } catch (e) { console.error("Error loading day for stats", date); }
            }
        });

        // 2. Initialize Accumulators
        let sumKcal = 0;
        let sumProtein = 0;
        let countNutritionDays = 0;
        let countAdherentDays = 0;
        let countClosedDays = 0;

        let totalSessions = 0;
        let completedSessions = 0;
        let totalMinutes = 0;
        const sessionsByType: Record<string, number> = { STRENGTH: 0, CARDIO: 0, SPORT: 0 };

        const dailyDataPoints: RangeStats['dailyData'] = [];

        // 3. Process each day
        dateRange.forEach(date => {
            const day = loadedDays[date];
            
            // Default points for charts (even empty days)
            const point = {
                date,
                calories: 0,
                protein: 0,
                trainingMinutes: 0,
                completedWorkouts: 0
            };

            if (day) {
                if (!day.isOpen) countClosedDays++;

                // Nutrition
                const meals = day.nutrition?.meals || [];
                if (meals.length > 0) {
                    const dayKcal = meals.reduce((sum, m) => sum + m.calories, 0);
                    const dayProt = meals.reduce((sum, m) => sum + m.protein, 0);
                    
                    sumKcal += dayKcal;
                    sumProtein += dayProt;
                    countNutritionDays++;
                    
                    point.calories = dayKcal;
                    point.protein = dayProt;

                    // Adherence (Simplistic: +/- 10% of current target)
                    // Note: Ideally we should store the target *of that day* in DayData to be accurate historically.
                    // For now, using current profile target as baseline estimation or hardcoded safe range.
                    const target = user.macroSettings.targets.calories;
                    if (dayKcal >= target * 0.9 && dayKcal <= target * 1.1) {
                        countAdherentDays++;
                    }
                }

                // Training
                const sessions = day.training?.sessions || [];
                totalSessions += sessions.length;
                
                sessions.forEach(s => {
                    if (s.completed) {
                        completedSessions++;
                        point.completedWorkouts++;
                        point.trainingMinutes += (s.durationMin || 0);
                        totalMinutes += (s.durationMin || 0);
                        
                        const type = s.type || 'OTHER';
                        sessionsByType[type] = (sessionsByType[type] || 0) + 1;
                    }
                });
            }
            dailyDataPoints.push(point);
        });

        // 4. Weight Logic (From User History which is source of truth)
        const relevantWeights = user.weightHistory
            .filter(w => w.date >= fromDate && w.date <= toDate)
            .sort((a, b) => a.date.localeCompare(b.date));

        // Fill gaps in weight for display if needed, but for "Change" use first/last actual
        let startWeight = 0;
        let endWeight = 0;
        let avgWeight = 0;

        if (relevantWeights.length > 0) {
            startWeight = relevantWeights[0].weight;
            endWeight = relevantWeights[relevantWeights.length - 1].weight;
            avgWeight = relevantWeights.reduce((acc, w) => acc + w.weight, 0) / relevantWeights.length;
        } else {
            // Fallback: look for last known weight before range
            const lastKnown = user.weightHistory
                .filter(w => w.date < fromDate)
                .sort((a, b) => b.date.localeCompare(a.date))[0];
            if (lastKnown) {
                startWeight = lastKnown.weight;
                endWeight = lastKnown.weight;
                avgWeight = lastKnown.weight;
            }
        }

        return {
            from: fromDate,
            to: toDate,
            daysLogged: countNutritionDays,
            daysClosed: countClosedDays,
            nutrition: {
                avgCalories: countNutritionDays > 0 ? Math.round(sumKcal / countNutritionDays) : 0,
                avgProtein: countNutritionDays > 0 ? Math.round(sumProtein / countNutritionDays) : 0,
                adherenceRate: countNutritionDays > 0 ? Math.round((countAdherentDays / countNutritionDays) * 100) : 0,
                totalCalories: Math.round(sumKcal),
                daysWithFood: countNutritionDays
            },
            training: {
                totalSessions,
                completedSessions,
                totalMinutes,
                byType: sessionsByType
            },
            weight: {
                start: startWeight,
                end: endWeight,
                change: Number((endWeight - startWeight).toFixed(1)),
                avg: Number(avgWeight.toFixed(1)),
                history: relevantWeights
            },
            dailyData: dailyDataPoints
        };
    }

    // --- UTILS ---

    public getWeekDates(referenceDate: Date = new Date()): { from: string, to: string } {
        const d = new Date(referenceDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            from: monday.toISOString().split('T')[0],
            to: sunday.toISOString().split('T')[0]
        };
    }

    public getMonthDates(year: number, month: number): { from: string, to: string } {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
            from: firstDay.toISOString().split('T')[0],
            to: lastDay.toISOString().split('T')[0]
        };
    }

    public getYearDates(year: number): { from: string, to: string } {
        return {
            from: `${year}-01-01`,
            to: `${year}-12-31`
        };
    }

    private getDatesInRange(startDate: string, endDate: string): string[] {
        const dates = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }
}

export const statsService = new StatsService();
