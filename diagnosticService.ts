
import { dayStore } from '../data/dayStore';
import { DayData, DaySummary } from '../types';

interface DiagnosticReport {
    issues: string[];
    indexCount: number;
    dataFilesCount: number;
    orphanedFiles: string[];
    missingIndexEntries: string[];
    corruptSessions: number;
    fixedCount: number;
}

const PREFIX = 'rafafit:day:';

class DiagnosticService {

    public scan(): DiagnosticReport {
        const report: DiagnosticReport = {
            issues: [],
            indexCount: 0,
            dataFilesCount: 0,
            orphanedFiles: [],
            missingIndexEntries: [],
            corruptSessions: 0,
            fixedCount: 0
        };

        const index = dayStore.getDayIndex();
        const indexKeys = new Set(Object.keys(index));
        report.indexCount = indexKeys.size;

        const storageKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX) && key !== 'rafafit:day_index') {
                storageKeys.push(key);
            }
        }
        report.dataFilesCount = storageKeys.length;

        // 1. Check Consistency
        storageKeys.forEach(key => {
            const date = key.replace(PREFIX, '');
            if (!indexKeys.has(date)) {
                report.missingIndexEntries.push(date);
                report.issues.push(`Index missing for date: ${date}`);
            }

            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const data: DayData = JSON.parse(raw);
                    
                    // Check Sessions
                    data.training.sessions.forEach(s => {
                        if (!s.id) {
                            report.corruptSessions++;
                            report.issues.push(`Session missing ID in ${date}`);
                        }
                        s.exercises.forEach(ex => {
                            if (!ex.slotId) {
                                report.issues.push(`Exercise missing slotId in ${date} / ${s.type}`);
                            }
                        });
                    });

                    // Check Meals
                    data.nutrition.meals.forEach(m => {
                        if (isNaN(m.calories) || isNaN(m.protein)) {
                            report.issues.push(`Corrupt macros in meal ${m.name} (${date})`);
                        }
                    });
                }
            } catch (e) {
                report.issues.push(`Corrupt JSON in ${key}`);
            }
        });

        // 2. Check Orphans (Index exists but no file - rare but possible)
        indexKeys.forEach(date => {
            if (!localStorage.getItem(`${PREFIX}${date}`)) {
                // Not necessarily an error if it's just a plan, but good to know
                // dayStore handles plans separately now, so we skip this check to avoid false positives
            }
        });

        return report;
    }

    public repair(): string[] {
        const logs: string[] = [];
        
        // 1. Rebuild Index (Fixes missing entries)
        dayStore.rebuildIndex();
        logs.push("Index reconstruido completamente.");

        // 2. Fix Internal Data Structures
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX) && key !== 'rafafit:day_index') {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const data: DayData = JSON.parse(raw);
                        let modified = false;

                        // Fix Sessions
                        data.training.sessions = data.training.sessions.map(s => {
                            if (!s.id) { s.id = crypto.randomUUID(); modified = true; }
                            s.exercises = s.exercises.map(ex => {
                                if (!ex.slotId) { ex.slotId = crypto.randomUUID(); modified = true; }
                                return ex;
                            });
                            return s;
                        });

                        // Fix corrupted meal values (NaN -> 0)
                        data.nutrition.meals = data.nutrition.meals.map(m => {
                            if (isNaN(m.calories)) { m.calories = 0; modified = true; }
                            if (isNaN(m.protein)) { m.protein = 0; modified = true; }
                            if (isNaN(m.carbs)) { m.carbs = 0; modified = true; }
                            if (isNaN(m.fats)) { m.fats = 0; modified = true; }
                            return m;
                        });

                        if (modified) {
                            localStorage.setItem(key, JSON.stringify(data));
                            logs.push(`Reparado archivo de datos: ${data.date}`);
                        }
                    }
                } catch (e) {
                    logs.push(`Error leyendo archivo corrupto: ${key}`);
                }
            }
        }

        return logs;
    }
}

export const diagnosticService = new DiagnosticService();
