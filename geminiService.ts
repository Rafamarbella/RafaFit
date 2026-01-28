import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_NUTRITIONIST, SYSTEM_INSTRUCTION_TRAINER } from '../constants';
import { WorkoutPlan, BaseFood, AISuggestion } from '../types';
import { calculateMacros } from '../utils/nutrition';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_REASONING = 'gemini-3-pro-preview';

// --- UTILS ---

/**
 * Wraps a promise with a timeout rejection.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number = 12000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms)
        )
    ]);
};

/**
 * Generates deterministic suggestions using local DB when AI fails.
 * Uses exact IDs from INITIAL_FOOD_DB.
 */
const getFallbackSuggestions = (availableFoods: BaseFood[]): AISuggestion[] => {
    // Helper to find food and calc macros
    const getIng = (id: string, grams: number) => {
        const food = availableFoods.find(f => f.id === id);
        if (!food) return null;
        return { name: food.displayName, grams, base: food };
    };

    const suggestions: AISuggestion[] = [];

    // Option 1: Clean Protein (Pollo)
    const pollo = getIng('pechuga-pollo', 200);
    const ensalada = getIng('espinacas', 100); // Using espinacas as proxy for salad
    const aceite = getIng('aceite-oliva', 10);
    
    if (pollo) {
        let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
        const ingredients = [pollo, ensalada, aceite].filter(Boolean) as { name: string, grams: number, base: BaseFood }[];
        
        ingredients.forEach(i => {
            const m = calculateMacros(i.base, i.grams);
            totalKcal += m.calories; totalP += m.protein; totalC += m.carbs; totalF += m.fats;
        });

        suggestions.push({
            mealName: "Plato Combinado Limpio",
            ingredients: ingredients.map(i => ({ name: i.name, grams: i.grams })),
            explanation: "Opción alta en proteína y baja en grasa para maximizar saciedad y mantener masa muscular. (Sugerencia Local)",
            estimatedTotals: { kcal: Math.round(totalKcal), p: Math.round(totalP), c: Math.round(totalC), f: Math.round(totalF) }
        });
    }

    // Option 2: Recovery (Merluza + Patata)
    const merluza = getIng('merluza', 250);
    const patata = getIng('patata-cocida', 200);
    
    if (merluza && patata) {
        let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
        const ingredients = [merluza, patata, aceite].filter(Boolean) as { name: string, grams: number, base: BaseFood }[];

        ingredients.forEach(i => {
            const m = calculateMacros(i.base, i.grams);
            totalKcal += m.calories; totalP += m.protein; totalC += m.carbs; totalF += m.fats;
        });

        suggestions.push({
            mealName: "Recuperación Digestiva",
            ingredients: ingredients.map(i => ({ name: i.name, grams: i.grams })),
            explanation: "Pescado blanco y patata cocida: fácil digestión y recarga de glucógeno segura. (Sugerencia Local)",
            estimatedTotals: { kcal: Math.round(totalKcal), p: Math.round(totalP), c: Math.round(totalC), f: Math.round(totalF) }
        });
    }

    // Option 3: Light Dinner (Huevo)
    const huevo = getIng('huevo', 120); // ~2 large eggs
    const espinacas = getIng('espinacas', 150);
    
    if (huevo) {
         let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
        const ingredients = [huevo, espinacas].filter(Boolean) as { name: string, grams: number, base: BaseFood }[];

        ingredients.forEach(i => {
            const m = calculateMacros(i.base, i.grams);
            totalKcal += m.calories; totalP += m.protein; totalC += m.carbs; totalF += m.fats;
        });

        suggestions.push({
            mealName: "Cena Antiinflamatoria",
            ingredients: ingredients.map(i => ({ name: i.name, grams: i.grams })),
            explanation: "Huevos y verduras. Proteína de alto valor biológico con fibra y muy pocos carbohidratos. (Sugerencia Local)",
            estimatedTotals: { kcal: Math.round(totalKcal), p: Math.round(totalP), c: Math.round(totalC), f: Math.round(totalF) }
        });
    }

    return suggestions;
};

// --- API METHODS ---

/**
 * TRAINING GENERATION
 */
export const generateSafeWorkout = async (userPhase: string): Promise<WorkoutPlan> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      duration: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['CIRCUIT', 'SETS', 'EMOM', 'AMRAP'] },
      notes: { type: Type.STRING },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            sets: { type: Type.NUMBER },
            reps: { type: Type.STRING },
            rest: { type: Type.STRING },
            videoUrl: { type: Type.STRING }
          },
          required: ['name', 'description', 'sets', 'reps', 'rest']
        }
      }
    },
    required: ['name', 'duration', 'type', 'exercises', 'notes']
  };

  const prompt = `
    Genera una rutina de entrenamiento de fuerza funcional para hoy.
    Nivel de energía: Normal.
    Tiempo disponible: 45 min.
    RECORDATORIO DE SEGURIDAD ESTRICTO: NO saltos, NO carga hombros, NO peso muerto pesado.
  `;

  try {
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TRAINER,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));
    const json = JSON.parse(response.text || '{}');
    return { ...json, id: crypto.randomUUID() };
  } catch (error) {
    console.error("Error generating workout:", error);
    throw error;
  }
};

/**
 * PARSE INPUT
 */
export const parseFoodInput = async (input: string | string[], isImage: boolean): Promise<{ name: string; grams: number }> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Generic food name (singular, e.g., 'pechuga de pollo', 'manzana'). No brand names unless specific." },
      grams: { type: Type.NUMBER, description: "Estimated weight in grams." },
    },
    required: ['name', 'grams']
  };

  const parts = [];
  if (isImage && Array.isArray(input)) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: input[0] } });
    parts.push({ text: "Identifica el alimento principal y estima su peso en gramos. Sé conservador." });
  } else {
    parts.push({ text: `Analiza: "${input}". Extrae nombre del alimento y cantidad en gramos. Si no se especifica cantidad, usa una ración estándar media.` });
  }

  try {
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: MODEL_FAST,
      contents: { parts },
      config: { responseMimeType: "application/json", responseSchema: schema }
    }), 8000); // Shorter timeout for parsing
    return JSON.parse(response.text || '{"name": "desconocido", "grams": 100}');
  } catch (e) {
    console.error("Error parsing food:", e);
    return { name: "Alimento desconocido", grams: 100 };
  }
};

/**
 * GET BASE DATA
 */
export const getFoodData100g = async (foodName: string): Promise<Omit<BaseFood, 'id'>> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      displayName: { type: Type.STRING, description: "Capitalized common name" },
      kcal100g: { type: Type.NUMBER },
      protein100g: { type: Type.NUMBER },
      carbs100g: { type: Type.NUMBER },
      fats100g: { type: Type.NUMBER },
      source: { type: Type.STRING, description: "Source of data (e.g. USDA, BEDCA, Estimated)" }
    },
    required: ['displayName', 'kcal100g', 'protein100g', 'carbs100g', 'fats100g', 'source']
  };

  const prompt = `Proporciona los valores nutricionales POR CADA 100g de: "${foodName}". Sé preciso y estándar.`;

  try {
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    }));
    const json = JSON.parse(response.text || '{}');
    return { ...json, version: 1, aliases: [foodName.toLowerCase()], category: 'OTRO' };
  } catch (e) {
    console.error("Error fetching 100g data:", e);
    // Fixed type error here: source 'Error-Fallback' -> 'API' and added default fields
    return { 
      displayName: foodName, 
      kcal100g: 100, 
      protein100g: 5, 
      carbs100g: 10, 
      fats100g: 5, 
      source: 'API', 
      version: 1,
      aliases: [foodName.toLowerCase()],
      category: 'OTRO' 
    };
  }
};

/**
 * SUGGEST MEALS (Robust with Fallback)
 */
export const suggestSmartMeals = async (
  remaining: { p: number, c: number, f: number }, 
  availableFoods: BaseFood[], 
  phase: string
): Promise<{ suggestions: AISuggestion[], source: 'AI' | 'LOCAL' }> => {
  
  const availableNames = availableFoods.map(f => f.displayName).join(", ");
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        mealName: { type: Type.STRING },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Must exactly match one of the available foods provided." },
              grams: { type: Type.NUMBER }
            }
          }
        },
        explanation: { type: Type.STRING },
        estimatedTotals: {
          type: Type.OBJECT,
          properties: { kcal: { type: Type.NUMBER }, p: { type: Type.NUMBER }, c: { type: Type.NUMBER }, f: { type: Type.NUMBER } }
        }
      }
    }
  };

  const prompt = `
    Rafa necesita completar sus macros: Faltan ${remaining.p}g Proteína, ${remaining.c}g Carbos, ${remaining.f}g Grasas.
    Fase: ${phase}.
    Alimentos disponibles: ${availableNames}.
    Sugiere 3 opciones. Calcula totales. Explica por qué.
  `;

  try {
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_NUTRITIONIST,
        responseMimeType: "application/json", 
        responseSchema: schema 
      }
    }));
    
    const parsed = JSON.parse(response.text || '[]');
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty AI response");
    
    return { suggestions: parsed, source: 'AI' };

  } catch (e) {
    console.error("AI Suggestion failed or timed out. Using Fallback.", e);
    // FALLBACK
    return { suggestions: getFallbackSuggestions(availableFoods), source: 'LOCAL' };
  }
};