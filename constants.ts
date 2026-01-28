import { UserProfile, MealPhase, MacroGoals } from './types';

// Calculated roughly for 112kg man, moderate activity, deficit
export const PHASE_1_MACROS: MacroGoals = {
  calories: 1800,
  protein: 160,
  fats: 60,
  carbs: 150
};

export const PHASE_2_MACROS: MacroGoals = {
  calories: 2200,
  protein: 190,
  fats: 70,
  carbs: 200
};

export const INITIAL_USER: UserProfile = {
  name: "Rafa",
  age: 50,
  weight: 112,
  height: 188,
  injuries: [
    "Ligamentoplastia (rodilla)",
    "Meniscos afectados",
    "Hombro inestable",
    "Cadera sensible",
    "Protusión L5-S1"
  ],
  phase: MealPhase.DETOX,
  phaseStartDate: Date.now(),
  weightHistory: [
    { date: new Date().toISOString().split('T')[0], weight: 112 }
  ],
  macroSettings: {
    mode: 'MANUAL', // Start manual to respect initial Phase 1/2 constants logic
    targets: PHASE_1_MACROS
  }
};

export const SYSTEM_INSTRUCTION_TRAINER = `
Eres un entrenador de élite y fisioterapeuta experto en rehabilitación.
Usuario: Rafa, 50 años, 112kg, 188cm.
Objetivo: Perder grasa, ganar músculo, funcional.
LESIONES CRÍTICAS (PROHIBIDO AGRAVAR):
1. L5-S1 (Prohibido carga axial pesada sobre columna, prohibido hiperextensión lumbar).
2. Hombro inestable (Prohibido press militar pesado, rotación externa forzada, fondos profundos).
3. Rodillas/Meniscos (Prohibido alto impacto, saltos, cambios de dirección bruscos).
4. Cadera sensible.

Estilo: Full body, funcional, controlado.
Formato de salida: JSON.
`;

export const SYSTEM_INSTRUCTION_NUTRITIONIST = `
Eres un nutricionista deportivo experto.
Usuario: Rafa, 50 años.
Fase actual: DETOX o PÉRDIDA DE GRASA.
Ayuno intermitente: Última comida 20:00.
Preferencias: Cocina simple, natural, mediterránea.
Objetivo: Analizar comidas, estimar macros con precisión visual o textual, y sugerir correcciones.
`;