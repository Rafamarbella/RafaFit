
import { DayData } from '../types';

class DayService {
  
  /**
   * Initializes a new day log with isOpen = true.
   */
  public createNewDay(date: string): DayData {
    return {
      date: date,
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

  /**
   * Closes the day manually.
   */
  public closeDay(log: DayData): DayData {
    return {
      ...log,
      isOpen: false,
      closedAt: new Date().toISOString()
    };
  }

  /**
   * Re-opens the day manually.
   */
  public reopenDay(log: DayData): DayData {
    return {
      ...log,
      isOpen: true,
      closedAt: undefined
    };
  }

  /**
   * Ensures the log has the correct DayData structure (migrations).
   */
  public validateLogStructure(log: any, date: string): DayData {
    if (!log) return this.createNewDay(date);

    // Migration for logs created before the Open/Closed feature or new nested structure
    const migratedLog = { ...log };

    // Migrate root meals/water to nutrition object
    if (!migratedLog.nutrition) {
      migratedLog.nutrition = {
        meals: Array.isArray(migratedLog.meals) ? migratedLog.meals : [],
      };
      // Clean up old root properties if desired, or leave them (doesn't hurt, but Typescript won't see them)
      delete migratedLog.meals;
      delete migratedLog.waterIntake;
    }

    // Migrate root workout/sessions to training object
    if (!migratedLog.training) {
      migratedLog.training = {
        sessions: Array.isArray(migratedLog.sessions) ? migratedLog.sessions : []
      };
    }

    if (migratedLog.isOpen === undefined) {
        migratedLog.isOpen = true; // Default to open for existing data to allow editing
        migratedLog.openedAt = migratedLog.openedAt || new Date().toISOString();
        migratedLog.date = migratedLog.date || date;
    }

    return migratedLog as DayData;
  }
}

export const dayService = new DayService();
