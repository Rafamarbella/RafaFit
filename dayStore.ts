
import { DayData, DaySummary } from '../types';

const PREFIX = 'rafafit:day:';
const INDEX_KEY = 'rafafit:day_index';
const PLAN_PREFIX = 'rafafit:dailyPlan:';

export const dayStore = {
  /**
   * Generates the storage key for a date
   */
  getKey(date: string) {
    return `${PREFIX}${date}`;
  },

  /**
   * Loads the lightweight index of all days.
   * If index doesn't exist, it rebuilds it.
   */
  getDayIndex(): Record<string, DaySummary> {
    try {
      const storedIndex = localStorage.getItem(INDEX_KEY);
      if (storedIndex) {
        return JSON.parse(storedIndex);
      } else {
        return this.rebuildIndex();
      }
    } catch (e) {
      console.error("Error loading day index", e);
      return {};
    }
  },

  /**
   * Updates a single entry in the index without full rebuild
   */
  updateIndexForDay(date: string) {
      try {
          const index = this.getDayIndex();
          // Load day data
          const dayRaw = localStorage.getItem(this.getKey(date));
          const dayData: DayData | null = dayRaw ? JSON.parse(dayRaw) : null;
          
          // Check for meal plan existence separately
          const hasPlan = localStorage.getItem(`${PLAN_PREFIX}${date}`) !== null;

          if (dayData) {
              index[date] = this.calculateSummary(dayData, hasPlan);
          } else if (hasPlan) {
              // Even if no day log, if there is a plan, show it
              index[date] = {
                  hasNutrition: false,
                  hasPlannedMeals: true,
                  hasTraining: false,
                  hasPlannedTraining: false,
                  hasWeight: false,
                  isOpen: true
              };
          }
          
          localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      } catch (e) {
          console.error("Error updating index for day", date, e);
      }
  },

  /**
   * Scans all localStorage keys to build the index.
   */
  rebuildIndex(): Record<string, DaySummary> {
    const index: Record<string, DaySummary> = {};
    const processedDates = new Set<string>();

    // 1. Scan Day Data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const dayData: DayData = JSON.parse(raw);
            const date = dayData.date;
            
            // Check if plan exists
            const hasPlan = localStorage.getItem(`${PLAN_PREFIX}${date}`) !== null;
            
            index[date] = this.calculateSummary(dayData, hasPlan);
            processedDates.add(date);
          }
        } catch (e) {
          console.warn("Skipping corrupted key", key);
        }
      }
    }

    // 2. Scan Meal Plans (for days that might not have a Log yet)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PLAN_PREFIX)) {
            const date = key.replace(PLAN_PREFIX, '');
            if (!processedDates.has(date)) {
                index[date] = {
                    hasNutrition: false,
                    hasPlannedMeals: true,
                    hasTraining: false,
                    hasPlannedTraining: false,
                    hasWeight: false,
                    isOpen: true
                };
            }
        }
    }

    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    return index;
  },

  /**
   * Helper to derive summary from full data
   */
  calculateSummary(data: DayData, hasPlannedMeals: boolean): DaySummary {
    const sessions = data.training?.sessions || [];
    const hasTraining = sessions.some(s => s.completed);
    const hasPlannedTraining = sessions.some(s => !s.completed);
    
    return {
      hasNutrition: (data.nutrition?.meals?.length || 0) > 0,
      hasPlannedMeals,
      hasTraining,
      hasPlannedTraining,
      hasWeight: !!data.weight,
      isOpen: data.isOpen !== false // Default true
    };
  },

  /**
   * Loads a day from storage or creates a fresh one.
   */
  loadDay(date: string): DayData {
    try {
      const stored = localStorage.getItem(this.getKey(date));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading day data", e);
    }
    return this.createEmptyDay(date);
  },

  /**
   * Saves a day to storage AND updates the index.
   */
  saveDay(data: DayData): void {
    try {
      // 1. Save Full Data
      localStorage.setItem(this.getKey(data.date), JSON.stringify(data));

      // 2. Update Index via helper to include Plan check
      this.updateIndexForDay(data.date);

    } catch (e) {
      console.error("Error saving day data (quota?)", e);
      alert("Error guardando datos: almacenamiento lleno.");
    }
  },

  /**
   * Returns a fresh day structure
   */
  createEmptyDay(date: string): DayData {
    return {
      date,
      isOpen: true,
      openedAt: new Date().toISOString(),
      nutrition: {
        meals: [],
      },
      training: {
        sessions: []
      }
    };
  }
};
