import { ExerciseBase, MuscleGroup, MuscleProfile, TrainingSession } from '../types';

export const ZERO_PROFILE: MuscleProfile = { CHEST: 0, BACK: 0, LEGS: 0, GLUTE: 0, SHOULDER: 0, ARMS: 0, CORE: 0 };

/**
 * Calculates the muscle load of a specific exercise instance.
 * Logic: sets * 1.0 * contribution.
 */
export const computeExerciseLoad = (
    muscleProfile: MuscleProfile, 
    sets: number = 3
): MuscleProfile => {
    const load: MuscleProfile = { ...ZERO_PROFILE };
    
    Object.entries(muscleProfile).forEach(([m, contribution]) => {
        const muscle = m as MuscleGroup;
        const baseLoad = sets * 1.0; // Assume 1 unit of volume per set
        load[muscle] = (load[muscle] || 0) + (baseLoad * (contribution || 0));
    });

    return load;
};

/**
 * Helper to determine if an exercise effectively works a muscle group.
 * Threshold is 0.2 (20% contribution).
 */
export const doesExerciseTarget = (profile: MuscleProfile, muscle: MuscleGroup | 'ALL'): boolean => {
    if (muscle === 'ALL') return true;
    return (profile[muscle] || 0) >= 0.2;
};

/**
 * Calculates the total load of a workout session.
 */
export const computeSessionLoad = (session: TrainingSession): MuscleProfile => {
    const load: MuscleProfile = { ...ZERO_PROFILE };

    if ((session.type !== 'STRENGTH' && session.type !== 'SPORT') || !session.completed) {
        return load;
    }

    // If manual sport, estimate a low generalized load if not defined (optional)
    if (session.type === 'SPORT') {
        // Sports usually hit legs/cardio mainly, hard to map without specific data. 
        // Returning 0 or cached load.
        return session.muscleLoad || load;
    }

    session.exercises.forEach(ex => {
        const exerciseLoad = computeExerciseLoad(ex.muscleProfile, ex.sets);
        
        Object.keys(exerciseLoad).forEach(k => {
            const m = k as MuscleGroup;
            load[m] = (load[m] || 0) + (exerciseLoad[m] || 0);
        });
    });

    return load;
};

/**
 * Aggregates fatigue from the last 72 hours with linear decay.
 * @param sessions All training sessions history
 * @param now Current date object
 */
export const computeFatigue72h = (sessions: TrainingSession[], now: Date = new Date()): MuscleProfile => {
    const fatigue: MuscleProfile = { ...ZERO_PROFILE };
    const cutoff = 72 * 60 * 60 * 1000; // 72 hours in ms

    // Filter sessions within window
    const recentSessions = sessions.filter(s => 
        s.completed && 
        (now.getTime() - new Date(s.dateISO).getTime()) <= cutoff &&
        new Date(s.dateISO) <= now
    );

    recentSessions.forEach(session => {
        const ageMs = now.getTime() - new Date(session.dateISO).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        // Linear Decay: 1.0 at 0h, 0.0 at 72h
        const decayFactor = Math.max(0, 1 - (ageHours / 72));

        // Use stored load or calculate it on fly
        const sLoad = session.muscleLoad || computeSessionLoad(session);

        Object.entries(sLoad).forEach(([m, val]) => {
            const muscle = m as MuscleGroup;
            const currentFatigue = fatigue[muscle] || 0;
            fatigue[muscle] = currentFatigue + ((val || 0) * decayFactor);
        });
    });

    return fatigue;
};