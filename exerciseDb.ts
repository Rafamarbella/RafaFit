
import { ExerciseBase } from '../types';

/**
 * COMPREHENSIVE EXERCISE DATABASE
 * 120+ Exercises categorized by Equipment, Pattern, and Muscle.
 * Includes precise Injury Tags for filtering.
 */
export const EXERCISE_DB: ExerciseBase[] = [
  
  // ==================================================================================
  // GIMNASIO (MÁQUINAS / PESO LIBRE CONTROLADO)
  // ==================================================================================

  // --- PIERNA (SQUAT / LUNGE PATTERNS) ---
  { id: 'gym_leg_press', name: 'Prensa de Piernas (45º)', category: 'GYM_MACHINES', pattern: 'SQUAT', avoidTags: [], sets: 3, reps: '10-12', restSec: 90, muscleProfile: { LEGS: 0.8, GLUTE: 0.4 } },
  { id: 'gym_leg_press_hor', name: 'Prensa Horizontal (Placas)', category: 'GYM_MACHINES', pattern: 'SQUAT', avoidTags: [], sets: 3, reps: '12', restSec: 90, muscleProfile: { LEGS: 0.8, GLUTE: 0.3 } },
  { id: 'gym_goblet_squat', name: 'Sentadilla Goblet (Mancuerna)', category: 'GYM_MACHINES', pattern: 'SQUAT', avoidTags: ['KNEE', 'LUMBAR'], sets: 3, reps: '10-12', restSec: 90, muscleProfile: { LEGS: 0.7, GLUTE: 0.5, CORE: 0.3 } },
  { id: 'gym_hack_squat', name: 'Sentadilla Hack (Máquina)', category: 'GYM_MACHINES', pattern: 'SQUAT', avoidTags: ['KNEE'], sets: 3, reps: '10', restSec: 90, muscleProfile: { LEGS: 0.9, GLUTE: 0.4 } },
  { id: 'gym_smith_squat', name: 'Sentadilla Multipower', category: 'GYM_MACHINES', pattern: 'SQUAT', avoidTags: ['KNEE', 'LUMBAR'], sets: 3, reps: '10', restSec: 90, muscleProfile: { LEGS: 0.8, GLUTE: 0.4 } },
  { id: 'gym_bulgarian_db', name: 'Sentadilla Búlgara (Mancuernas)', category: 'GYM_MACHINES', pattern: 'LUNGE', avoidTags: ['KNEE'], sets: 3, reps: '8-10/lado', restSec: 90, muscleProfile: { LEGS: 0.6, GLUTE: 0.7 } },
  { id: 'gym_lunge_static_sm', name: 'Zancada Estática Multipower', category: 'GYM_MACHINES', pattern: 'LUNGE', avoidTags: ['KNEE'], sets: 3, reps: '10/pierna', restSec: 60, muscleProfile: { LEGS: 0.6, GLUTE: 0.6 } },
  { id: 'gym_lunge_walk_db', name: 'Zancadas Caminando (Mancuernas)', category: 'GYM_MACHINES', pattern: 'LUNGE', avoidTags: ['KNEE', 'ANKLE'], sets: 3, reps: '12 pasos', restSec: 90, muscleProfile: { LEGS: 0.6, GLUTE: 0.6 } },
  { id: 'gym_leg_ext', name: 'Extensiones de Cuádriceps', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['KNEE'], sets: 3, reps: '12-15', restSec: 60, muscleProfile: { LEGS: 1.0 } },
  
  // --- CADERA / GLÚTEO (HINGE) ---
  { id: 'gym_rdl_db', name: 'Peso Muerto Rumano (Mancuernas)', category: 'GYM_MACHINES', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '10-12', restSec: 90, muscleProfile: { GLUTE: 0.6, LEGS: 0.6, BACK: 0.3 } },
  { id: 'gym_leg_curl_ly', name: 'Curl Femoral Tumbado', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12-15', restSec: 60, muscleProfile: { LEGS: 0.3, GLUTE: 0.2 } },
  { id: 'gym_leg_curl_seat', name: 'Curl Femoral Sentado', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12-15', restSec: 60, muscleProfile: { LEGS: 0.3, GLUTE: 0.2 } },
  { id: 'gym_hip_thrust_mach', name: 'Hip Thrust en Máquina', category: 'GYM_MACHINES', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '12', restSec: 90, muscleProfile: { GLUTE: 1.0, LEGS: 0.2 } },
  { id: 'gym_cable_pull_through', name: 'Pull Through en Polea', category: 'GYM_MACHINES', pattern: 'HINGE', avoidTags: [], sets: 3, reps: '15', restSec: 60, muscleProfile: { GLUTE: 0.8, LEGS: 0.3 } },
  { id: 'gym_back_ext', name: 'Extensiones de Espalda (Banco 45º)', category: 'GYM_MACHINES', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '15', restSec: 60, muscleProfile: { BACK: 0.5, GLUTE: 0.5 } },

  // --- EMPUJE HORIZONTAL (PECHO) & ALTERNATIVAS ---
  { id: 'gym_chest_press_mach', name: 'Press de Pecho en Máquina', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '10-12', restSec: 60, muscleProfile: { CHEST: 0.8, SHOULDER: 0.2, ARMS: 0.2 } },
  { id: 'gym_chest_press_convergent', name: 'Press Pecho Convergente', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '10-12', restSec: 60, muscleProfile: { CHEST: 0.85, SHOULDER: 0.15 } },
  { id: 'gym_chest_press_neutral', name: 'Press Pecho Agarre Neutro', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10-12', restSec: 60, muscleProfile: { CHEST: 0.7, ARMS: 0.3 }, notes: "Menor estrés hombro" },
  { id: 'gym_chest_press_db', name: 'Press Banca con Mancuernas', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10', restSec: 90, muscleProfile: { CHEST: 0.8, SHOULDER: 0.3, ARMS: 0.2 } },
  { id: 'gym_incline_press_mach', name: 'Press Inclinado Máquina', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10-12', restSec: 60, muscleProfile: { CHEST: 0.7, SHOULDER: 0.4 } },
  { id: 'gym_incline_press_db', name: 'Press Inclinado Mancuernas', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10', restSec: 90, muscleProfile: { CHEST: 0.7, SHOULDER: 0.4 } },
  { id: 'gym_cable_press_stand', name: 'Press Pecho en Polea (Pie)', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '12-15', restSec: 60, muscleProfile: { CHEST: 0.7, CORE: 0.3 } },
  { id: 'gym_smith_press', name: 'Press Banca en Multipower', category: 'GYM_MACHINES', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10', restSec: 90, muscleProfile: { CHEST: 0.8, SHOULDER: 0.2 } },
  { id: 'gym_pec_fly', name: 'Aperturas en Máquina (Peck Deck)', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '12-15', restSec: 60, muscleProfile: { CHEST: 0.9, SHOULDER: 0.1 } },
  { id: 'gym_cable_fly', name: 'Cruce de Poleas (Pecho)', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 60, muscleProfile: { CHEST: 0.9 } },
  
  // --- EMPUJE VERTICAL (HOMBRO) ---
  { id: 'gym_shoulder_press_mach', name: 'Press Hombros Máquina', category: 'GYM_MACHINES', pattern: 'PUSH_VERT', avoidTags: ['SHOULDER'], sets: 3, reps: '10-12', restSec: 60, muscleProfile: { SHOULDER: 0.9, ARMS: 0.3 } },
  { id: 'gym_shoulder_press_db', name: 'Press Militar Mancuernas (Sentado)', category: 'GYM_MACHINES', pattern: 'PUSH_VERT', avoidTags: ['SHOULDER', 'LUMBAR'], sets: 3, reps: '10', restSec: 90, muscleProfile: { SHOULDER: 0.9, ARMS: 0.3 } },
  { id: 'gym_lat_raise_db', name: 'Elevaciones Laterales Mancuerna', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 45, muscleProfile: { SHOULDER: 1.0 } },
  { id: 'gym_lat_raise_cable', name: 'Elevaciones Laterales Polea', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '12-15', restSec: 45, muscleProfile: { SHOULDER: 1.0 } },
  { id: 'gym_front_raise_db', name: 'Elevaciones Frontales', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '12', restSec: 45, muscleProfile: { SHOULDER: 0.8 } },

  // --- TIRÓN VERTICAL (ESPALDA) ---
  { id: 'gym_lat_pull', name: 'Jalón al Pecho (Agarre ancho)', category: 'GYM_MACHINES', pattern: 'PULL_VERT', avoidTags: ['SHOULDER'], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.8, ARMS: 0.3 } },
  { id: 'gym_lat_pull_supine', name: 'Jalón al Pecho (Agarre supino)', category: 'GYM_MACHINES', pattern: 'PULL_VERT', avoidTags: ['SHOULDER', 'ELBOW'], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.7, ARMS: 0.5 } },
  { id: 'gym_lat_pull_neutral', name: 'Jalón al Pecho (Agarre neutro)', category: 'GYM_MACHINES', pattern: 'PULL_VERT', avoidTags: [], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.8, ARMS: 0.3 } },
  { id: 'gym_asist_pullup', name: 'Dominadas Asistidas Máquina', category: 'GYM_MACHINES', pattern: 'PULL_VERT', avoidTags: ['SHOULDER'], sets: 3, reps: '8-10', restSec: 90, muscleProfile: { BACK: 0.9, ARMS: 0.4 } },
  { id: 'gym_pullover_cable', name: 'Pullover en Polea Alta', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 60, muscleProfile: { BACK: 0.8, CORE: 0.2 } },

  // --- TIRÓN HORIZONTAL (REMO) ---
  { id: 'gym_seated_row', name: 'Remo en Máquina (Agarre neutro)', category: 'GYM_MACHINES', pattern: 'PULL_HOR', avoidTags: ['LUMBAR'], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.8, ARMS: 0.2 } },
  { id: 'gym_low_row_cable', name: 'Remo Gironda (Polea baja)', category: 'GYM_MACHINES', pattern: 'PULL_HOR', avoidTags: ['LUMBAR'], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.8, ARMS: 0.2 } },
  { id: 'gym_chest_sup_row', name: 'Remo con Mancuernas (Pecho apoyado)', category: 'GYM_MACHINES', pattern: 'PULL_HOR', avoidTags: [], sets: 3, reps: '12', restSec: 60, muscleProfile: { BACK: 0.9, ARMS: 0.2 } },
  { id: 'gym_single_arm_row', name: 'Remo Unilateral Mancuerna', category: 'GYM_MACHINES', pattern: 'PULL_HOR', avoidTags: ['LUMBAR'], sets: 3, reps: '10/lado', restSec: 60, muscleProfile: { BACK: 0.8, ARMS: 0.3 } },
  { id: 'gym_face_pull', name: 'Face Pull (Polea Alta)', category: 'GYM_MACHINES', pattern: 'PULL_HOR', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { SHOULDER: 0.7, BACK: 0.3 } },

  // --- BRAZOS Y CORE (GYM) ---
  { id: 'gym_biceps_db', name: 'Curl Bíceps Mancuerna', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_hammer_curl', name: 'Curl Martillo', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_biceps_cable', name: 'Curl Bíceps Polea', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_triceps_pushdown', name: 'Extensión Tríceps Polea (Cuerda)', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_triceps_bar', name: 'Extensión Tríceps Polea (Barra)', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_triceps_overhead', name: 'Extensión Tríceps Trasnuca', category: 'GYM_MACHINES', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '12', restSec: 45, muscleProfile: { ARMS: 1.0 } },
  { id: 'gym_farmer_walk', name: 'Paseo del Granjero', category: 'GYM_MACHINES', pattern: 'CARRY', avoidTags: ['LUMBAR', 'WRIST'], sets: 3, reps: '30 seg', restSec: 60, muscleProfile: { CORE: 0.6, ARMS: 0.4 } },
  // CORE - ANTIROTACION ADICIONAL
  { id: 'gym_pallof_cable', name: 'Press Pallof en Polea', category: 'GYM_MACHINES', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '12/lado', restSec: 45, muscleProfile: { CORE: 1.0 } },
  { id: 'gym_pallof_kneel', name: 'Pallof Kneeling (Arrodillado)', category: 'GYM_MACHINES', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '12/lado', restSec: 45, muscleProfile: { CORE: 1.0 }, notes: "Mayor estabilidad pélvica" },

  // ==================================================================================
  // BANDAS ELÁSTICAS (HOME / TRAVEL)
  // ==================================================================================

  // --- TRACCIÓN (PULL) ---
  { id: 'band_row_stand', name: 'Remo de pie con Goma', category: 'BANDS', pattern: 'PULL_HOR', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { BACK: 0.7, ARMS: 0.2 } },
  { id: 'band_row_seat', name: 'Remo Sentado con Goma', category: 'BANDS', pattern: 'PULL_HOR', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { BACK: 0.8, ARMS: 0.2 } },
  { id: 'band_lat_pull', name: 'Jalón Dorsal (Rodillas)', category: 'BANDS', pattern: 'PULL_VERT', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 45, muscleProfile: { BACK: 0.8, ARMS: 0.2 } },
  { id: 'band_face_pull', name: 'Face Pull con Goma', category: 'BANDS', pattern: 'PULL_HOR', avoidTags: [], sets: 3, reps: '15-20', restSec: 45, muscleProfile: { SHOULDER: 0.6, BACK: 0.3 } },
  { id: 'band_pull_apart', name: 'Band Pull Aparts', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '20', restSec: 45, muscleProfile: { SHOULDER: 0.5, BACK: 0.3 } },
  { id: 'band_shrug', name: 'Encogimientos con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { BACK: 0.6 } },

  // --- EMPUJE (PUSH) ---
  { id: 'band_chest_press', name: 'Press Pecho con Goma (Pie)', category: 'BANDS', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { CHEST: 0.7, SHOULDER: 0.2 } },
  { id: 'band_pushup_resist', name: 'Flexiones con Resistencia', category: 'BANDS', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER', 'WRIST'], sets: 3, reps: '10', restSec: 60, muscleProfile: { CHEST: 0.8, ARMS: 0.3 } },
  { id: 'band_chest_fly', name: 'Aperturas con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 45, muscleProfile: { CHEST: 0.9 } },
  { id: 'band_shoulder_press', name: 'Press Hombros Unilateral', category: 'BANDS', pattern: 'PUSH_VERT', avoidTags: ['SHOULDER'], sets: 3, reps: '12/lado', restSec: 45, muscleProfile: { SHOULDER: 0.8, ARMS: 0.2 } },
  { id: 'band_lat_raise', name: 'Elevaciones Laterales Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 45, muscleProfile: { SHOULDER: 1.0 } },
  { id: 'band_front_raise', name: 'Elevaciones Frontales Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: ['SHOULDER'], sets: 3, reps: '15', restSec: 45, muscleProfile: { SHOULDER: 0.8 } },

  // --- PIERNA (LEGS) Y VARIANTES ISQUIOS ---
  { id: 'band_squat', name: 'Sentadilla pisando Goma', category: 'BANDS', pattern: 'SQUAT', avoidTags: ['KNEE', 'LUMBAR'], sets: 3, reps: '15', restSec: 60, muscleProfile: { LEGS: 0.7, GLUTE: 0.3 } },
  { id: 'band_zercher_squat', name: 'Sentadilla Zercher con Goma', category: 'BANDS', pattern: 'SQUAT', avoidTags: ['LUMBAR'], sets: 3, reps: '12', restSec: 60, muscleProfile: { LEGS: 0.7, CORE: 0.4 } },
  { id: 'band_deadlift', name: 'Peso Muerto con Goma', category: 'BANDS', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '15', restSec: 60, muscleProfile: { GLUTE: 0.6, LEGS: 0.5, BACK: 0.3 } },
  { id: 'band_good_morning', name: 'Buenos Días con Goma', category: 'BANDS', pattern: 'HINGE', avoidTags: ['LUMBAR', 'NECK'], sets: 3, reps: '12', restSec: 60, muscleProfile: { GLUTE: 0.6, LEGS: 0.4 } },
  { id: 'band_lunge', name: 'Zancada Estática con Goma', category: 'BANDS', pattern: 'LUNGE', avoidTags: ['KNEE'], sets: 3, reps: '12/lado', restSec: 60, muscleProfile: { LEGS: 0.6, GLUTE: 0.5 } },
  { id: 'band_glute_bridge', name: 'Puente Glúteo con Goma', category: 'BANDS', pattern: 'HINGE', avoidTags: [], sets: 3, reps: '20', restSec: 45, muscleProfile: { GLUTE: 0.9 } },
  { id: 'band_clam', name: 'Clamshell (Almeja) con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15/lado', restSec: 30, muscleProfile: { GLUTE: 0.8 } },
  { id: 'band_monster_walk', name: 'Monster Walk Lateral', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '12 pasos', restSec: 45, muscleProfile: { GLUTE: 0.8, LEGS: 0.2 } },
  { id: 'band_leg_curl', name: 'Curl Femoral Tumbado Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { LEGS: 0.6 } },
  { id: 'band_leg_curl_seated', name: 'Curl Femoral Sentado Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 45, muscleProfile: { LEGS: 0.6 }, notes: "Goma anclada enfrente" },
  { id: 'band_rdl_single', name: 'Peso Muerto Rumano Unilateral', category: 'BANDS', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '10/lado', restSec: 60, muscleProfile: { GLUTE: 0.5, LEGS: 0.5 } },

  // --- BRAZOS Y CORE (BANDS) & VARIANTES PALLOF ---
  { id: 'band_biceps', name: 'Curl Bíceps Pisando Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { ARMS: 1.0 } },
  { id: 'band_hammer', name: 'Curl Martillo con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { ARMS: 1.0 } },
  { id: 'band_triceps_push', name: 'Jalón Tríceps con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { ARMS: 1.0 } },
  { id: 'band_triceps_kick', name: 'Patada Tríceps con Goma', category: 'BANDS', pattern: 'ISOLATION', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { ARMS: 1.0 } },
  { id: 'band_pallof', name: 'Press Pallof (Antirotación)', category: 'BANDS', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '12/lado', restSec: 45, muscleProfile: { CORE: 1.0 } },
  { id: 'band_pallof_hold', name: 'Pallof Hold Isométrico', category: 'BANDS', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '30s/lado', restSec: 45, muscleProfile: { CORE: 1.0 } },
  { id: 'band_woodchop', name: 'Leñador (Woodchop)', category: 'BANDS', pattern: 'CORE_ANTI', avoidTags: ['LUMBAR'], sets: 3, reps: '12/lado', restSec: 45, muscleProfile: { CORE: 0.8, SHOULDER: 0.2 } },

  // ==================================================================================
  // CIRCUITO / BODYWEIGHT (BAJO IMPACTO)
  // ==================================================================================

  // --- FULL BODY / CARDIO SUAVE ---
  { id: 'circ_step_up', name: 'Step-Ups (Subida a cajón)', category: 'CIRCUIT_BW', pattern: 'LUNGE', avoidTags: ['KNEE'], sets: 3, reps: '10/pierna', restSec: 30, muscleProfile: { LEGS: 0.8, GLUTE: 0.5 } },
  { id: 'circ_march', name: 'Marcha Estática (Rodillas altas)', category: 'CIRCUIT_BW', pattern: 'CARDIO', avoidTags: [], sets: 3, reps: '40 seg', restSec: 20, muscleProfile: { LEGS: 0.3, CORE: 0.2 } },
  { id: 'circ_jj_no_impact', name: 'Jumping Jacks (Sin impacto)', category: 'CIRCUIT_BW', pattern: 'CARDIO', avoidTags: [], sets: 3, reps: '40 seg', restSec: 20, muscleProfile: { LEGS: 0.2, SHOULDER: 0.2 } },
  { id: 'circ_sit_stand', name: 'Sentarse y Levantarse', category: 'CIRCUIT_BW', pattern: 'SQUAT', avoidTags: ['KNEE'], sets: 3, reps: '12', restSec: 30, muscleProfile: { LEGS: 0.7, GLUTE: 0.3 } },
  { id: 'circ_bear_crawl', name: 'Caminata de Oso (Bear Crawl)', category: 'CIRCUIT_BW', pattern: 'CARRY', avoidTags: ['WRIST', 'SHOULDER'], sets: 3, reps: '30 seg', restSec: 45, muscleProfile: { CORE: 0.6, SHOULDER: 0.4 } },
  { id: 'circ_wall_sit', name: 'Sentadilla Isométrica (Pared)', category: 'CIRCUIT_BW', pattern: 'SQUAT', avoidTags: [], sets: 3, reps: '30-45s', restSec: 45, muscleProfile: { LEGS: 0.8 } },

  // --- CORE & SUELO ---
  { id: 'circ_plank', name: 'Plancha Abdominal', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: ['LUMBAR', 'SHOULDER'], sets: 3, reps: '30-45s', restSec: 30, muscleProfile: { CORE: 1.0 } },
  { id: 'circ_plank_knees', name: 'Plancha sobre Rodillas', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: ['LUMBAR'], sets: 3, reps: '30s', restSec: 30, muscleProfile: { CORE: 0.8 } },
  { id: 'circ_side_plank', name: 'Plancha Lateral', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: ['SHOULDER'], sets: 3, reps: '20s/lado', restSec: 30, muscleProfile: { CORE: 0.9 } },
  { id: 'circ_side_plank_k', name: 'Plancha Lateral (Rodillas)', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '20s/lado', restSec: 30, muscleProfile: { CORE: 0.8 } },
  { id: 'circ_bird_dog', name: 'Bird-Dog', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '10/lado', restSec: 30, muscleProfile: { CORE: 0.8, GLUTE: 0.2 } },
  { id: 'circ_dead_bug', name: 'Dead Bug', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '10 total', restSec: 30, muscleProfile: { CORE: 0.9 } },
  { id: 'circ_dead_bug_wall', name: 'Dead Bug (Empuje Pared)', category: 'CIRCUIT_BW', pattern: 'CORE_ANTI', avoidTags: [], sets: 3, reps: '30s', restSec: 30, muscleProfile: { CORE: 1.0 } },
  { id: 'circ_glute_bridge', name: 'Puente de Glúteo Suelo', category: 'CIRCUIT_BW', pattern: 'HINGE', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { GLUTE: 0.9, CORE: 0.2 } },
  { id: 'circ_bridge_walkout', name: 'Puente Glúteo Walkout', category: 'CIRCUIT_BW', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '8', restSec: 45, muscleProfile: { GLUTE: 0.5, LEGS: 0.5 }, notes: "Foco isquios" },
  { id: 'circ_single_leg_bridge', name: 'Puente Glúteo Unilateral', category: 'CIRCUIT_BW', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '10/lado', restSec: 30, muscleProfile: { GLUTE: 1.0 } },
  { id: 'circ_superman', name: 'Superman (Isométrico)', category: 'CIRCUIT_BW', pattern: 'HINGE', avoidTags: ['LUMBAR'], sets: 3, reps: '15s', restSec: 30, muscleProfile: { BACK: 0.5, GLUTE: 0.5 } },
  
  // --- TREN SUPERIOR (BW) & ALTERNATIVAS BAJO IMPACTO ---
  { id: 'circ_pushup', name: 'Flexiones (Push-ups)', category: 'CIRCUIT_BW', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER', 'WRIST'], sets: 3, reps: '8-12', restSec: 45, muscleProfile: { CHEST: 0.8, ARMS: 0.3 } },
  { id: 'circ_knee_pushup', name: 'Flexiones con Rodillas', category: 'CIRCUIT_BW', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER', 'WRIST'], sets: 3, reps: '10', restSec: 45, muscleProfile: { CHEST: 0.7, ARMS: 0.3 } },
  { id: 'circ_wall_pushup', name: 'Flexiones en Pared', category: 'CIRCUIT_BW', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '12', restSec: 30, muscleProfile: { CHEST: 0.6, ARMS: 0.2 } },
  { id: 'circ_incline_pushup', name: 'Flexiones Inclinadas (Mesa/Sofá)', category: 'CIRCUIT_BW', pattern: 'PUSH_HOR', avoidTags: ['SHOULDER'], sets: 3, reps: '10', restSec: 45, muscleProfile: { CHEST: 0.7, ARMS: 0.3 }, notes: "Menos peso que suelo" },
  { id: 'circ_wall_pushup_plus', name: 'Wall Push-up Plus (Escápula)', category: 'CIRCUIT_BW', pattern: 'PUSH_HOR', avoidTags: [], sets: 3, reps: '15', restSec: 30, muscleProfile: { BACK: 0.4, CHEST: 0.3 }, notes: "Salud hombros" },
  { id: 'circ_tricep_dip_floor', name: 'Fondos de Tríceps en Suelo', category: 'CIRCUIT_BW', pattern: 'PUSH_VERT', avoidTags: ['SHOULDER', 'WRIST'], sets: 3, reps: '12', restSec: 30, muscleProfile: { ARMS: 0.8 } },
  { id: 'circ_scap_pushup', name: 'Flexiones Escapulares', category: 'CIRCUIT_BW', pattern: 'MOBILITY', avoidTags: [], sets: 3, reps: '12', restSec: 30, muscleProfile: { BACK: 0.4, SHOULDER: 0.4 } },
  
  // --- MOVILIDAD ---
  { id: 'mob_cat_cow', name: 'Gato-Vaca (Cat-Cow)', category: 'CIRCUIT_BW', pattern: 'MOBILITY', avoidTags: [], sets: 2, reps: '10', restSec: 0, muscleProfile: { BACK: 0.1 } },
  { id: 'mob_open_book', name: 'Libro Abierto (Open Book)', category: 'CIRCUIT_BW', pattern: 'MOBILITY', avoidTags: [], sets: 2, reps: '8/lado', restSec: 0, muscleProfile: { BACK: 0.1 } },
  { id: 'mob_hip_flexor', name: 'Estiramiento Flexor Cadera', category: 'CIRCUIT_BW', pattern: 'MOBILITY', avoidTags: ['KNEE'], sets: 2, reps: '30s/lado', restSec: 0, muscleProfile: { LEGS: 0.1 } }
];

// O(1) Lookup
export const EXERCISE_BY_ID = EXERCISE_DB.reduce((acc, ex) => {
    acc[ex.id] = ex;
    return acc;
}, {} as Record<string, ExerciseBase>);

// Fallback exercises for injuries
export const FALLBACK_EXERCISES: Record<string, ExerciseBase> = {
  'KNEE': EXERCISE_BY_ID['circ_wall_sit'] || EXERCISE_DB[0],
  'SHOULDER': EXERCISE_BY_ID['band_pull_apart'] || EXERCISE_DB[0],
  'LUMBAR': EXERCISE_BY_ID['circ_dead_bug'] || EXERCISE_DB[0],
};
