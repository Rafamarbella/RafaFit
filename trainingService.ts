
import { TrainingSession, StrengthSubtype, CardioSubtype, ExerciseBase, UserProfile, InjuryTag, MuscleGroup, MuscleProfile, TrainingConstraints, MovementPattern } from '../types';
import { EXERCISE_DB, FALLBACK_EXERCISES } from '../data/exerciseDb';
import { computeFatigue72h, computeSessionLoad, doesExerciseTarget } from '../utils/trainingLoad';
import { injuryService } from './injuryService';

const STORAGE_KEY = 'rafa_training_schedule';
const DAY_KEY_PREFIX = 'rafafit:day:';
const FATIGUE_THRESHOLD = 6; 

class TrainingService {
  
  // --- FATIGUE CALCULATION WRAPPER ---
  public getRecentFatigue(allSessions: TrainingSession[]): MuscleProfile {
      return computeFatigue72h(allSessions);
  }

  // --- CONSTRAINT CHECKER ---
  
  private isExerciseSafe(exercise: ExerciseBase, constraints: TrainingConstraints): boolean {
      // 1. Check Tags
      const hasBannedTag = exercise.avoidTags.some(tag => constraints.bannedTags.includes(tag));
      if (hasBannedTag) return false;

      // 2. Check Keywords in Name or Notes
      const text = (exercise.name + ' ' + (exercise.notes || '')).toLowerCase();
      const hasBannedKeyword = constraints.bannedKeywords.some(kw => text.includes(kw));
      if (hasBannedKeyword) return false;

      return true;
  }

  // --- HISTORY MANAGEMENT ---

  public getRecentExerciseHistory(lookbackDays: number = 14): Set<string> {
      const history = new Set<string>();
      const now = new Date();
      
      for (let i = 0; i < lookbackDays; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const key = `${DAY_KEY_PREFIX}${dateStr}`;
          
          try {
              const raw = localStorage.getItem(key);
              if (raw) {
                  const dayData = JSON.parse(raw);
                  if (dayData.training && Array.isArray(dayData.training.sessions)) {
                      dayData.training.sessions.forEach((s: TrainingSession) => {
                          if (s.type === 'STRENGTH' && s.exercises) {
                              s.exercises.forEach((ex: ExerciseBase) => {
                                  if (ex.id) history.add(ex.id);
                              });
                          }
                      });
                  }
              }
          } catch (e) {
              console.warn("Failed to read history for", dateStr);
          }
      }
      return history;
  }

  // --- HELPER: INFER METADATA ---
  private inferPattern(ex: ExerciseBase): MovementPattern | undefined {
      if (ex.pattern) return ex.pattern;
      const n = ex.name.toLowerCase();
      
      // Basic heuristics based on spanish names
      if (n.includes('press') || n.includes('flexion') || n.includes('push') || n.includes('fondos')) {
          return (n.includes('hombro') || n.includes('militar') || n.includes('trasnuca')) ? 'PUSH_VERT' : 'PUSH_HOR';
      }
      if (n.includes('remo') || n.includes('jalon') || n.includes('dominada') || n.includes('pull')) {
          return (n.includes('jalon') || n.includes('dominada') || n.includes('vertical')) ? 'PULL_VERT' : 'PULL_HOR';
      }
      if (n.includes('sentadilla') || n.includes('prensa') || n.includes('squat')) return 'SQUAT';
      if (n.includes('peso muerto') || n.includes('hip thrust') || n.includes('puente') || n.includes('bridge') || n.includes('superman')) return 'HINGE';
      if (n.includes('zancada') || n.includes('step') || n.includes('lunge')) return 'LUNGE';
      if (n.includes('plancha') || n.includes('pallof') || n.includes('bug') || n.includes('core')) return 'CORE_ANTI';
      if (n.includes('curl') || n.includes('extension')) return 'ISOLATION';
      
      return undefined;
  }

  // --- EXERCISE SWAPPING LOGIC (TIERED FALLBACK) ---

  public getExerciseAlternatives(
    currentExercise: ExerciseBase,
    session: TrainingSession,
    user: UserProfile
  ): ExerciseBase[] {
    if (session.type !== 'STRENGTH') return [];

    const constraints = injuryService.getActiveConstraints(user);
    const sessionSubtype = session.subtype as StrengthSubtype;
    const currentPattern = this.inferPattern(currentExercise);
    
    // 1. Identify Primary Target of current exercise
    let primaryTarget: MuscleGroup = 'LEGS';
    let maxVal = 0;
    Object.entries(currentExercise.muscleProfile).forEach(([muscle, val]) => {
        if ((val as number) > maxVal) {
            maxVal = val as number;
            primaryTarget = muscle as MuscleGroup;
        }
    });

    // 2. Identify excluded IDs (Strictly current session + current)
    const sessionIds = new Set(session.exercises.map(e => e.id));
    sessionIds.add(currentExercise.id);

    const historyIds = this.getRecentExerciseHistory(14);

    console.debug(`Finding alts for: ${currentExercise.name} (${currentPattern}, ${primaryTarget})`);

    // Helper to score candidates
    const scoreCandidate = (ex: ExerciseBase) => {
        let score = 0;
        const pat = this.inferPattern(ex);
        if (currentPattern && pat === currentPattern) score += 20;
        
        const targetContribution = ex.muscleProfile[primaryTarget] || 0;
        score += targetContribution * 10;

        // Diversity bonus (if name is very different)
        if (!ex.name.includes(currentExercise.name.split(' ')[0])) score += 5;
        
        return score;
    };

    // --- LEVEL ENGINE ---
    // We try progressively relaxed constraints until we have enough candidates (>= 3)

    const runQuery = (
        allowRecent: boolean, 
        relaxPattern: boolean, 
        relaxEquipment: boolean,
        relaxMuscle: boolean // Just matching group, not specific intensity
    ): ExerciseBase[] => {
        return EXERCISE_DB.filter(ex => {
            // A. Hard Exclusions (Session & Self)
            if (sessionIds.has(ex.id)) return false;
            
            // B. Safety (Always Strict)
            if (!this.isExerciseSafe(ex, constraints)) return false;

            // C. History
            if (!allowRecent && historyIds.has(ex.id)) return false;

            // D. Equipment (Category)
            let catMatch = false;
            if (relaxEquipment) {
                // If Gym, allow anything except strictly Bands if user has no bands? 
                // Assuming "Relax" means allow adjacent. 
                // GYM -> Allow BODYWEIGHT (Circuit) matches. 
                // BANDS -> Allow BODYWEIGHT.
                // CIRCUIT -> Allow BANDS if owned? (Assume yes for simplicity or just stick to safe pools)
                if (sessionSubtype === 'GYM_MACHINES') catMatch = (ex.category === 'GYM_MACHINES' || ex.category === 'CIRCUIT_BW' || ex.category === 'ALL');
                else if (sessionSubtype === 'BANDS') catMatch = (ex.category === 'BANDS' || ex.category === 'CIRCUIT_BW' || ex.category === 'ALL');
                else catMatch = (ex.category === sessionSubtype || ex.category === 'ALL');
            } else {
                catMatch = (ex.category === sessionSubtype || ex.category === 'ALL');
            }
            if (!catMatch) return false;

            // E. Pattern & Muscle
            const pat = this.inferPattern(ex);
            const muscleVal = ex.muscleProfile[primaryTarget] || 0;

            if (relaxPattern) {
                // Must match muscle significantly
                if (muscleVal < (relaxMuscle ? 0.2 : 0.4)) return false;
            } else {
                // Must match pattern AND muscle
                if (pat !== currentPattern) return false;
                if (muscleVal < 0.2) return false;
            }

            return true;
        });
    };

    let candidates: ExerciseBase[] = [];

    // LEVEL 1: Strict (No history, Same Pattern, Same Equipment)
    candidates = runQuery(false, false, false, false);
    if (candidates.length >= 3) return this.finalizeCandidates(candidates, scoreCandidate);

    console.debug(`Level 1 found ${candidates.length}, trying Level 2 (Allow History)`);
    // LEVEL 2: Allow History
    candidates = runQuery(true, false, false, false);
    if (candidates.length >= 3) return this.finalizeCandidates(candidates, scoreCandidate);

    console.debug(`Level 2 found ${candidates.length}, trying Level 3 (Relax Pattern)`);
    // LEVEL 3: Relax Pattern (Same Equipment, Compatible Muscle)
    candidates = runQuery(true, true, false, false);
    if (candidates.length >= 3) return this.finalizeCandidates(candidates, scoreCandidate);

    console.debug(`Level 3 found ${candidates.length}, trying Level 4 (Relax Equipment)`);
    // LEVEL 4: Relax Equipment (e.g. Gym -> BW)
    candidates = runQuery(true, true, true, false);
    if (candidates.length >= 3) return this.finalizeCandidates(candidates, scoreCandidate);

    console.debug(`Level 4 found ${candidates.length}, trying Level 5 (Broad Muscle Match)`);
    // LEVEL 5: Last Resort (Any safe exercise for that muscle group)
    candidates = runQuery(true, true, true, true);
    
    return this.finalizeCandidates(candidates, scoreCandidate);
  }

  private finalizeCandidates(
      candidates: ExerciseBase[], 
      scorer: (ex: ExerciseBase) => number,
      limit = 5
  ): ExerciseBase[] {
      // Deduplicate by ID just in case
      const unique = Array.from(new Map(candidates.map(c => [c.id, c])).values());
      return unique
          .map(ex => ({ ex, score: scorer(ex) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(i => i.ex);
  }

  /**
   * Performs the actual swap in the session, preserving the slot's structure (sets/reps/time)
   */
  public executeSwap(
      session: TrainingSession,
      slotId: string,
      newExerciseBase: ExerciseBase
  ): TrainingSession {
      const exerciseIndex = session.exercises.findIndex(e => e.slotId === slotId);
      if (exerciseIndex === -1) return session;

      const oldExercise = session.exercises[exerciseIndex];

      // Merge: New Exercise Data + Old Slot Structure
      const mergedExercise: ExerciseBase = {
          ...newExerciseBase,
          slotId: oldExercise.slotId, // Keep same slot ID for React keys stability
          sets: oldExercise.sets,
          reps: oldExercise.reps, // Preserve volume format
          restSec: oldExercise.restSec,
          completed: false, // Reset completion
          replacedFrom: oldExercise.id,
          replacedAt: new Date().toISOString()
      };

      const newExercises = [...session.exercises];
      newExercises[exerciseIndex] = mergedExercise;

      return {
          ...session,
          exercises: newExercises
      };
  }

  // --- WORKOUT GENERATION ---

  /**
   * Generates a ROBUST Full Body session.
   * Uses history to rotate exercises.
   */
  public generateStrengthSession(
    subtype: StrengthSubtype, 
    user: UserProfile, 
    date: string,
    existingSessions: TrainingSession[] = [] 
  ): TrainingSession {
    
    const constraints = injuryService.getActiveConstraints(user);
    const fatigue = this.getRecentFatigue(existingSessions);
    const historyIds = this.getRecentExerciseHistory(14); // Avoid repetition from last 2 weeks if possible
    
    // 1. Filter Safe Candidates for this Subtype
    const pool = EXERCISE_DB.filter(ex => 
        (ex.category === subtype || ex.category === 'ALL') &&
        this.isExerciseSafe(ex, constraints)
    );

    // 2. Blueprint with Patterns
    // A robust Full Body usually contains: Squat, Hinge, Push, Pull, Lunge/Carry, Core
    const blueprint: { role: string, patterns: MovementPattern[], target?: MuscleGroup[] }[] = [
        { role: 'MAIN_KNEE', patterns: ['SQUAT', 'LUNGE'], target: ['LEGS'] },      
        { role: 'MAIN_PUSH', patterns: ['PUSH_HOR', 'PUSH_VERT'], target: ['CHEST', 'SHOULDER'] },           
        { role: 'MAIN_HINGE', patterns: ['HINGE'], target: ['GLUTE', 'BACK'] }, 
        { role: 'MAIN_PULL', patterns: ['PULL_HOR', 'PULL_VERT'], target: ['BACK'] },         
        { role: 'ACC_LEGS', patterns: ['LUNGE', 'ISOLATION'], target: ['GLUTE', 'LEGS'] },           
        { role: 'ACC_UPPER', patterns: ['ISOLATION', 'PUSH_VERT', 'PULL_HOR'], target: ['SHOULDER', 'ARMS'] },       
        { role: 'CORE', patterns: ['CORE_ANTI', 'CARRY'], target: ['CORE'] },
        { role: 'METABOLIC', patterns: ['CARDIO', 'MOBILITY', 'SQUAT'], target: ['LEGS'] }
    ];

    const selectedExercises: ExerciseBase[] = [];
    const selectedIds = new Set<string>();

    // Helper to find best exercise for a slot
    const pickExercise = (slot: typeof blueprint[0]) => {
        // Filter by Pattern and Muscle
        let candidates = pool.filter(ex => {
            const exPat = this.inferPattern(ex);
            const patternMatch = slot.patterns.includes(exPat as any);
            const muscleMatch = slot.target ? slot.target.some(m => doesExerciseTarget(ex.muscleProfile, m)) : true;
            return patternMatch || muscleMatch;
        });

        // Filter out already selected in this session
        candidates = candidates.filter(c => !selectedIds.has(c.id));

        if (candidates.length === 0) return null;

        // Sort by freshness (prefer not in history)
        candidates.sort((a, b) => {
            const aUsed = historyIds.has(a.id) ? 1 : 0;
            const bUsed = historyIds.has(b.id) ? 1 : 0;
            return aUsed - bUsed || (Math.random() - 0.5); // Randomize if same freshness
        });

        return candidates[0];
    };

    // 3. Select Exercises
    blueprint.forEach(slot => {
        if (selectedExercises.length >= 8) return;

        const match = pickExercise(slot);

        if (match) {
            selectedExercises.push({ ...match });
            selectedIds.add(match.id);
        } else {
            // Fallback Logic
            const fallbackKey = slot.role.includes('PUSH') ? 'SHOULDER' : (slot.role.includes('KNEE') ? 'KNEE' : null);
            if (fallbackKey) {
                const fb = FALLBACK_EXERCISES[fallbackKey];
                if (fb && this.isExerciseSafe(fb, constraints) && !selectedIds.has(fb.id)) {
                    selectedExercises.push({ ...fb, notes: (fb.notes || '') + ' (Alt. segura)' });
                    selectedIds.add(fb.id);
                }
            }
        }
    });

    // 4. Fill if short (unlikely with big DB)
    if (selectedExercises.length < 5) {
        const remaining = pool.filter(c => !selectedIds.has(c.id)).sort(() => Math.random() - 0.5);
        for (const rem of remaining) {
            if (selectedExercises.length >= 6) break;
            selectedExercises.push(rem);
            selectedIds.add(rem.id);
        }
    }

    // 5. Apply Format & Generate IDs
    const isCircuit = subtype === 'CIRCUIT_BW';
    
    const finalExercises = selectedExercises.map(ex => {
        let modifiedEx = { ...ex, slotId: crypto.randomUUID() }; // Generate Unique Slot ID
        
        if (isCircuit) {
            modifiedEx.sets = 3; 
            modifiedEx.reps = "40s"; 
            modifiedEx.restSec = 20; 
        } else if (subtype === 'BANDS') {
            modifiedEx.sets = 3;
            modifiedEx.reps = "12-15";
            modifiedEx.restSec = 45;
        } else {
            // Keep default if exists, else standard
            modifiedEx.sets = ex.sets || 3;
            modifiedEx.reps = ex.reps || "10-12";
        }

        // Adjust for Fatigue
        const primaryMuscles = Object.entries(ex.muscleProfile)
            .filter(([_, v]) => (v as number) > 0.4)
            .map(([k]) => k as MuscleGroup);
        
        const isFatigued = primaryMuscles.some(m => (fatigue[m] || 0) > FATIGUE_THRESHOLD);
        if (isFatigued) {
            modifiedEx.sets = Math.max(1, (modifiedEx.sets || 3) - 1);
            modifiedEx.notes = (modifiedEx.notes ? modifiedEx.notes + '. ' : '') + '⚠️ Fatiga: sets reducidos.';
        }
        return modifiedEx;
    });

    const notes = isCircuit 
        ? "Formato Circuito: Realiza un ejercicio tras otro con 20s de descanso. Al terminar la ronda completa, descansa 2 minutos. Haz 3 rondas."
        : "Descanso entre series: 60-90 segundos. Prioriza la técnica sobre el peso.";

    return {
      id: crypto.randomUUID(),
      dateISO: date,
      type: 'STRENGTH',
      subtype,
      durationMin: 45 + (finalExercises.length * 2),
      completed: false,
      exercises: finalExercises,
      notes: notes,
      muscleLoad: fatigue,
      generatedWithConstraintsHash: injuryService.getConstraintsHash(user)
    };
  }

  public generateCardioSession(
      subtype: string, 
      date: string, 
      duration: number = 45,
      completed: boolean = false
    ): TrainingSession {
    return {
      id: crypto.randomUUID(),
      dateISO: date,
      type: 'CARDIO',
      subtype: subtype, 
      durationMin: duration,
      completed: completed,
      completedAt: completed ? Date.now() : undefined,
      exercises: [],
      notes: 'Actividad cardiovascular registrada.'
    };
  }

  public reopenSession(session: TrainingSession): TrainingSession {
    // Regenerate slotIds if missing on reopen to be safe
    const fixedExercises = session.exercises.map(ex => ({
        ...ex,
        slotId: ex.slotId || crypto.randomUUID()
    }));

    return {
      ...session,
      exercises: fixedExercises,
      completed: false,
      completedAt: undefined 
    };
  }

  // --- PLAN MANAGEMENT ---

  public generateWeeklyPlan(user: UserProfile): TrainingSession[] {
    const sessions: TrainingSession[] = [];
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(today.setDate(diff));

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Basic Schedule: M-W-F Strength, T-T Cardio
    sessions.push(this.generateStrengthSession('GYM_MACHINES', user, formatDate(monday)));
    
    const tue = new Date(monday); tue.setDate(monday.getDate() + 1);
    sessions.push(this.generateCardioSession('Caminar', formatDate(tue), 45));

    const wed = new Date(monday); wed.setDate(monday.getDate() + 2);
    sessions.push(this.generateStrengthSession('GYM_MACHINES', user, formatDate(wed)));

    const thu = new Date(monday); thu.setDate(monday.getDate() + 3);
    sessions.push(this.generateCardioSession('Bicicleta', formatDate(thu), 45));

    const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
    sessions.push(this.generateStrengthSession('GYM_MACHINES', user, formatDate(fri)));

    return sessions;
  }

  public getWeeklyPlan(user: UserProfile): TrainingSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading schedule", e);
    }
    const newPlan = this.generateWeeklyPlan(user);
    this.savePlan(newPlan);
    return newPlan;
  }

  public savePlan(sessions: TrainingSession[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  public updateSession(session: TrainingSession, allSessions: TrainingSession[]) {
    if (session.completed && !session.completedAt) {
        session.completedAt = Date.now();
    }
    
    if (session.type === 'STRENGTH' && session.completed && !session.muscleLoad) {
        session.muscleLoad = computeSessionLoad(session);
    }

    const newSessions = allSessions.map(s => s.id === session.id ? session : s);
    this.savePlan(newSessions);
    return newSessions;
  }

  public addSession(session: TrainingSession, allSessions: TrainingSession[]) {
    const newSessions = [...allSessions, session];
    this.savePlan(newSessions);
    return newSessions;
  }
}

export const trainingService = new TrainingService();
