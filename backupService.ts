
import { dayStore } from '../data/dayStore';

interface BackupData {
    timestamp: number;
    version: number;
    appName: string;
    data: Record<string, any>;
}

class BackupService {
    
    /**
     * Exports all keys starting with 'rafa' or 'rafafit' to a JSON file.
     */
    public exportData() {
        const data: Record<string, any> = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('rafafit:') || key.startsWith('rafa_'))) {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        data[key] = JSON.parse(value);
                    }
                } catch (e) {
                    console.warn(`Skipping non-JSON key: ${key}`);
                }
            }
        }

        const backup: BackupData = {
            timestamp: Date.now(),
            version: 1,
            appName: 'RafaFit',
            data: data
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `rafafit-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Imports data from a JSON string.
     * @param jsonString Raw content of the file
     * @param mode 'REPLACE' clears existing data first. 'MERGE' overwrites collisions with backup data but keeps others.
     */
    public importData(jsonString: string, mode: 'REPLACE' | 'MERGE'): { success: boolean; message: string } {
        try {
            const backup: BackupData = JSON.parse(jsonString);

            // Basic Validation
            if (!backup.data || typeof backup.data !== 'object') {
                return { success: false, message: "Formato de archivo inválido." };
            }

            if (mode === 'REPLACE') {
                // Clear app specific keys
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('rafafit:') || key.startsWith('rafa_'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            }

            // Write Data (In MERGE mode, this overwrites existing keys with Backup version)
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });

            // Rebuild Indexes
            dayStore.rebuildIndex();

            return { success: true, message: `Importación completada (${Object.keys(backup.data).length} items).` };

        } catch (e) {
            console.error("Import failed", e);
            return { success: false, message: "Error procesando el archivo JSON." };
        }
    }

    public async readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
}

export const backupService = new BackupService();
