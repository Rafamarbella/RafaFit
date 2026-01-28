import { BaseFood, SearchResult } from '../types';
import { CORE_FOODS } from '../data/coreFoods';

const CUSTOM_DB_KEY = 'rafa_custom_foods';

class FoodService {
  private mergedFoods: BaseFood[] = [];
  private foodsById: Map<string, BaseFood> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    if (this.isInitialized) return;
    
    // 1. Load Custom Foods
    let customFoods: BaseFood[] = [];
    try {
      const stored = localStorage.getItem(CUSTOM_DB_KEY);
      if (stored) customFoods = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load custom foods", e);
    }

    // 2. Merge (Custom overrides Core if ID collision - unlikely due to uuid vs slug)
    // We prioritize Core for consistency, but append Custom.
    const foodMap = new Map<string, BaseFood>();
    
    CORE_FOODS.forEach(f => foodMap.set(f.id, f));
    customFoods.forEach(f => foodMap.set(f.id, f)); // Custom overwrites if same ID
    
    this.mergedFoods = Array.from(foodMap.values());
    this.foodsById = foodMap;
    this.isInitialized = true;
  }

  public getAllFoods(): BaseFood[] {
    return this.mergedFoods;
  }

  public getFoodById(id: string): BaseFood | undefined {
    return this.foodsById.get(id);
  }

  public saveCustomFood(food: BaseFood): void {
    // Save to Local State
    this.foodsById.set(food.id, food);
    this.mergedFoods = Array.from(this.foodsById.values());

    // Persist to LocalStorage
    const currentCustom = this.mergedFoods.filter(f => f.source === 'CUSTOM');
    localStorage.setItem(CUSTOM_DB_KEY, JSON.stringify(currentCustom));
  }

  /**
   * High-performance search with scoring
   * @param query User input text
   * @param limit Max results
   */
  public searchFoods(query: string, limit = 20): SearchResult[] {
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const q = normalize(query.trim());
    
    if (!q) return [];

    const results: SearchResult[] = [];

    for (const food of this.mergedFoods) {
      const name = normalize(food.displayName);
      let score = 0;
      let matchType: SearchResult['matchType'] = 'CONTAINS';

      // 1. Exact Match
      if (name === q) {
        score = 100;
        matchType = 'EXACT';
      } 
      // 2. Starts With
      else if (name.startsWith(q)) {
        score = 80;
        matchType = 'STARTS_WITH';
      }
      // 3. Word Starts With (e.g. "Pollo" matches "Pechuga de Pollo")
      else if (name.includes(` ${q}`)) {
        score = 60;
        matchType = 'CONTAINS';
      }
      // 4. Contains
      else if (name.includes(q)) {
        score = 40;
        matchType = 'CONTAINS';
      }
      
      // 5. Check Aliases
      if (score < 90 && food.aliases) {
        for (const alias of food.aliases) {
            const normAlias = normalize(alias);
            if (normAlias === q) {
                score = Math.max(score, 90);
                matchType = 'ALIAS';
            } else if (normAlias.startsWith(q)) {
                score = Math.max(score, 70);
                matchType = 'ALIAS';
            } else if (normAlias.includes(q)) {
                score = Math.max(score, 30);
                matchType = 'ALIAS';
            }
        }
      }

      if (score > 0) {
        results.push({ food, score, matchType });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

export const foodService = new FoodService();