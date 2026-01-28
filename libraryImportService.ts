
import { UserFoodItem } from '../types';
import { foodService } from './foodService';
import { normalizeFoodName } from '../utils/nutrition';

class LibraryImportService {

    /**
     * Parses raw text into LibraryItems.
     * Tries to auto-match against Verified DB.
     */
    public processImport(text: string, source: 'TEXT' | 'FILE'): UserFoodItem[] {
        const lines = text.split(/[\n,;]/); // Split by newline, comma, semicolon
        const results: UserFoodItem[] = [];
        const seenNames = new Set<string>();

        for (const line of lines) {
            const cleanName = this.cleanLine(line);
            if (!cleanName || cleanName.length < 2) continue;
            if (seenNames.has(cleanName.toLowerCase())) continue;

            seenNames.add(cleanName.toLowerCase());

            // Try Match
            const match = this.findBestMatch(cleanName);
            
            const newItem: UserFoodItem = {
                id: crypto.randomUUID(),
                name: cleanName,
                source: source,
                createdAt: Date.now(),
                status: match ? 'VERIFIED' : 'PENDING',
                matchedDbId: match?.id,
                macrosPer100: match ? {
                    kcal: match.kcal100g,
                    protein: match.protein100g,
                    carbs: match.carbs100g,
                    fat: match.fats100g
                } : undefined,
                category: match?.category,
                notes: match ? `Auto-match: ${match.displayName}` : undefined
            };

            results.push(newItem);
        }

        return results;
    }

    /**
     * Cleans garbage from copy-paste lists (bullets, amounts, etc.)
     * Ex: "- 200g Pechuga de pollo" -> "Pechuga de pollo"
     */
    private cleanLine(line: string): string {
        return line
            .replace(/^[-•*>\d]+\.?\s*/, '') // Remove bullets/numbers at start
            .replace(/^\d+(?:g|gr|kg|ml|oz|lb)\s+(?:de\s+)?/i, '') // Remove "100g de..."
            .replace(/\(.*\)/g, '') // Remove parenthesis content
            .trim();
    }

    private findBestMatch(name: string) {
        const results = foodService.searchFoods(name, 1);
        if (results.length > 0 && results[0].score >= 80) {
            return results[0].food;
        }
        return null;
    }

    /**
     * Reads a file and returns content as text
     */
    public async readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
}

export const libraryImportService = new LibraryImportService();
