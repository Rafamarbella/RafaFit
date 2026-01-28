
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  NUTRITION = 'NUTRITION',
  TRAINING = 'TRAINING',
  PROFILE = 'PROFILE',
  CALENDAR = 'CALENDAR',
  STATS = 'STATS'
}

export enum MealPhase {
  DETOX = 'DETOX', // Phase 1
  FAT_LOSS = 'FAT_LOSS' // Phase 2
}

export type MealSlot = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK';

export type FoodCategory = 
  | 'PROTEINA' | 'CARBOHIDRATO' | 'GRASA' 
  | 'FRUTA' | 'VERDURA' | 'LACTEO' 
  | 'BEBIDA' | 'SNACK' | 'SALSAS' | 'OTRO';

// Granular categorization for strict rules
export type SubCategory = 
  | 'PROTEIN_SOLID'   // Chicken, Fish, Meat, Eggs, Tofu
  | 'PROTEIN_SUPP'    // Whey, Casein
  | 'LEGUME'          // Lentils, Beans (Can be carb or protein source)
  | 'DAIRY'           // Yogurt, Cheese, Milk
  | 'FRUIT'
  | 'VEG'
  | 'CARB_STARCH'     // Rice, Potato, Pasta
  | 'CARB_BREAKFAST'  // Oats, Bread, Toast
  | 'FAT_COOKING'     // Oil, Butter
  | 'FAT_WHOLE'       // Avocado, Nuts
  | 'UNDEFINED';

export type NutritionSource = 'VERIFIED_DB' | 'VERIFIED_USER' | 'UNVERIFIED';

export interface MacroGoals {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

export interface WeightEntry {
  date: string; // ISO Date YYYY-MM-DD
  weight: number; // kg
}

export interface MacroSettings {
  mode: 'AUTO' | 'MANUAL';
  targets: MacroGoals;
  lastUpdated?: number; // Timestamp
  source?: 'AUTO_ADJUST' | 'MANUAL';
}

export interface BaseFood {
  id: string; 
  displayName: string;
  aliases: string[]; 
  category: FoodCategory;
  subCategory?: SubCategory; // Optional until inferred
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fats100g: number;
  source: 'CORE' | 'CUSTOM' | 'API'; 
  version: number;
}

export interface FoodLogItem {
  id: string;
  foodId: string;
  name: string;
  grams: number;
  slot: MealSlot;
  isEstimated?: boolean;
  unitCount?: number;
  unitLabel?: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  timestamp: number;
  imageUrl?: string;
  consumed?: boolean; // True if eaten, False if planned
  source?: 'PLAN_APPLIED' | 'MANUAL'; // Traceability
}

export interface FavoriteMeal {
  id: string;
  name: string;
  ingredients: { foodId: string; grams: number }[];
}

// --- NUTRITION PLANNER & LIBRARY MODELS ---

export interface UserFoodItem {
  id: string;
  name: string;
  // Source tracking
  source: 'TEXT' | 'FILE' | 'MANUAL' | 'DB'; 
  createdAt: number;
  
  // Verification Status
  status: 'VERIFIED' | 'PENDING';
  
  // Data (Only present if Resolved/Verified)
  matchedDbId?: string; // If verified against Core DB
  macrosPer100?: { kcal: number; protein: number; carbs: number; fat: number };
  
  // Classification
  category?: FoodCategory;
  subCategory?: SubCategory;
  
  notes?: string;
}

export interface PlanItem {
  id: string; // unique instance id
  itemId: string; // ID referencing UserFoodItem or BaseFood
  name: string;
  category: FoodCategory;
  subCategory?: SubCategory;
  amount: number;
  unit: 'g' | 'ml' | 'unit';
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  sourceType: NutritionSource;
}

export interface MealPlanSlot {
  slot: MealSlot;
  items: PlanItem[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
}

export interface DailyMealPlan {
  date: string; // YYYY-MM-DD
  meals: MealPlanSlot[];
  dayTotals: { kcal: number; protein: number; carbs: number; fat: number };
  status: 'DRAFT' | 'APPLIED';
}

export interface WeeklyMealPlan {
  weekId: string; // e.g., 2026-W05
  days: Record<string, DailyMealPlan>; // Keyed by YYYY-MM-DD
  generatedAt: number;
}

// --- TRAINING TYPES ---
export type TrainingType = 'STRENGTH' | 'CARDIO' | 'SPORT' | 'REST';
export type StrengthSubtype = 'GYM_MACHINES' | 'BANDS' | 'CIRCUIT_BW';
export type CardioSubtype = 'WALK' | 'BIKE' | 'SPINNING' | 'SWIM';
export type SportSubtype = 'PADEL' | 'TENIS' | 'FUTBOL' | 'SENDERISMO' | 'OTRO';

// Expanded Injury Tags for Custom Injuries
export type InjuryTag = 'KNEE' | 'SHOULDER' | 'LUMBAR' | 'HIP' | 'ELBOW' | 'WRIST' | 'NECK' | 'BACK_GENERAL' | 'ANKLE';

export type BodyArea = 'HOMBRO' | 'CODO' | 'MUÑECA' | 'ESPALDA' | 'LUMBAR' | 'CADERA' | 'RODILLA' | 'TOBILLO' | 'CUELLO' | 'OTRO';

export interface CustomInjury {
  id: string;
  title: string;
  bodyArea: BodyArea;
  severity: number; // 1-5
  isActive: boolean;
  avoidMovements?: string[]; // Keywords to ban
  createdAt: number;
  updatedAt?: number;
}

export interface TrainingConstraints {
  bannedTags: InjuryTag[];
  bannedKeywords: string[];
}

export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'GLUTE' | 'SHOULDER' | 'ARMS' | 'CORE';
export type MuscleProfile = Partial<Record<MuscleGroup, number>>;

// New: Patterns for smarter substitutions
export type MovementPattern = 
  | 'SQUAT' | 'HINGE' | 'LUNGE' // Lower Body
  | 'PUSH_HOR' | 'PUSH_VERT'    // Upper Push
  | 'PULL_HOR' | 'PULL_VERT'    // Upper Pull
  | 'CARRY' | 'CORE_ANTI' | 'ISOLATION' | 'CARDIO' | 'MOBILITY';

export type VideoProvider = 'youtube';
export type VideoSource = 'cache' | 'localDb' | 'autoSearch' | 'manual';

export interface ExerciseVideo {
  provider: VideoProvider;
  url: string;
  language: 'es';
  startSec?: number;
  endSec?: number;
  isShort?: boolean;
  notes?: string;
  source?: VideoSource;
  broken?: boolean;
  lastCheckedAt?: string;
}

export interface ExerciseBase {
  id: string; // Database ID (e.g., 'gym_squat')
  slotId?: string; // Unique Instance ID for session (e.g., 'uuid-1234')
  
  name: string;
  pattern?: MovementPattern; // Structural pattern
  sets?: number;
  reps?: string;
  restSec?: number;
  notes?: string;
  avoidTags: InjuryTag[];
  category: StrengthSubtype | 'ALL';
  muscleProfile: MuscleProfile;
  completed?: boolean;
  video?: ExerciseVideo;
  
  // Replacement logic
  replacedFrom?: string; // ID of the exercise that was swapped out
  replacedAt?: string; // ISO timestamp
}

export interface TrainingSession {
  id: string;
  dateISO: string;
  type: TrainingType;
  subtype?: StrengthSubtype | CardioSubtype | SportSubtype | string;
  durationMin: number;
  exercises: ExerciseBase[];
  completed: boolean;
  completedAt?: number;
  notes?: string;
  intensity?: 'LOW' | 'MODERATE' | 'HIGH';
  muscleLoad?: MuscleProfile;
  
  // Track constraints used to generate this session
  generatedWithConstraintsHash?: string; 
}

export interface WorkoutPlan {
  id: string;
  name: string;
  duration: string;
  type: string;
  notes: string;
  exercises: {
    name: string;
    description: string;
    sets: number;
    reps: string;
    rest: string;
    videoUrl?: string;
  }[];
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; 
  height: number;
  injuries: string[];
  phase: MealPhase;
  phaseStartDate: number;
  weightHistory: WeightEntry[];
  macroSettings: MacroSettings;
  hasOnboarded?: boolean; // New flag for onboarding
}

export interface AISuggestion {
  mealName: string;
  ingredients: { name: string; grams: number }[];
  explanation: string;
  estimatedTotals: { kcal: number; p: number; c: number; f: number };
}

export interface UnitConversion {
  id: string;
  label: string;
  grams: number;
  aliases: string[];
  defaultIfNoNumber?: boolean;
  askUnitsIfPluralNoNumber?: boolean;
  foodKeyHint?: string;
}

export interface SearchResult {
  food: BaseFood;
  score: number;
  matchType: 'EXACT' | 'STARTS_WITH' | 'CONTAINS' | 'ALIAS';
}

export interface ParsedFood {
  foodId: string | null;
  foodNameRaw: string;
  quantity: {
    type: 'EXACT' | 'ESTIMATED' | 'UNKNOWN';
    grams: number;
    unitCount?: number;
    unitLabel?: string;
  };
}

// --- NEW CENTRALIZED DAY STORE MODEL ---

export interface DayNutrition {
  meals: FoodLogItem[];
}

export interface DayTraining {
  sessions: TrainingSession[];
}

export interface DaySummary {
  hasNutrition: boolean; // Logged meals > 0
  hasPlannedMeals: boolean; // DailyMealPlan exists
  hasTraining: boolean; // Completed sessions > 0
  hasPlannedTraining: boolean; // Uncompleted sessions > 0
  hasWeight: boolean;
  isOpen: boolean;
}

export interface DayData {
  date: string; // YYYY-MM-DD key
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  
  weight?: number; // Daily weight log
  
  nutrition: DayNutrition;
  training: DayTraining;
  
  notes?: string;
}

// --- STATS INTERFACES ---

export interface RangeStats {
  from: string;
  to: string;
  daysLogged: number;
  daysClosed: number;
  
  nutrition: {
    avgCalories: number;
    avgProtein: number;
    adherenceRate: number; // % of days near target
    totalCalories: number;
    daysWithFood: number;
  };
  
  training: {
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    byType: Record<string, number>; // STRENGTH, CARDIO count
  };
  
  weight: {
    start: number;
    end: number;
    change: number;
    avg: number;
    history: WeightEntry[]; // Filtered for this range
  };
  
  dailyData: {
    date: string;
    calories: number;
    protein: number;
    trainingMinutes: number;
    completedWorkouts: number;
  }[];
}

// --- TOAST TYPES ---
export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}
