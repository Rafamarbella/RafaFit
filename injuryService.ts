
import { CustomInjury, UserProfile, TrainingConstraints, BodyArea, InjuryTag } from '../types';

const STORAGE_KEY = 'rafafit:customInjuries';

class InjuryService {
    private injuries: CustomInjury[] = [];
    private isLoaded = false;

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            this.injuries = stored ? JSON.parse(stored) : [];
            this.isLoaded = true;
        } catch (e) {
            console.error("Error loading custom injuries", e);
            this.injuries = [];
        }
    }

    private save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.injuries));
        } catch (e) {
            console.error("Error saving custom injuries", e);
        }
    }

    // --- CRUD ---

    public getAll(): CustomInjury[] {
        if (!this.isLoaded) this.load();
        // Sort by Created Descending
        return [...this.injuries].sort((a, b) => b.createdAt - a.createdAt);
    }

    public add(injury: Omit<CustomInjury, 'id' | 'createdAt' | 'updatedAt'>): CustomInjury[] {
        if (!this.isLoaded) this.load();
        
        const newInjury: CustomInjury = {
            ...injury,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Immutable update
        this.injuries = [newInjury, ...this.injuries];
        this.save();
        return this.getAll();
    }

    public toggleActive(id: string): CustomInjury[] {
        if (!this.isLoaded) this.load();

        // Immutable update to ensure React state picks it up
        this.injuries = this.injuries.map(inj => {
            if (inj.id === id) {
                return { 
                    ...inj, 
                    isActive: !inj.isActive, 
                    updatedAt: Date.now() 
                };
            }
            return inj;
        });

        this.save();
        return this.getAll();
    }

    public delete(id: string): CustomInjury[] {
        if (!this.isLoaded) this.load();
        
        this.injuries = this.injuries.filter(i => i.id !== id);
        this.save();
        return this.getAll();
    }

    // --- CONSTRAINT BUILDER ---

    /**
     * Maps BodyArea to internal InjuryTag
     */
    private mapAreaToTag(area: BodyArea): InjuryTag | null {
        const map: Record<BodyArea, InjuryTag | null> = {
            'HOMBRO': 'SHOULDER',
            'RODILLA': 'KNEE',
            'LUMBAR': 'LUMBAR',
            'CADERA': 'HIP',
            'CODO': 'ELBOW',
            'MUÑECA': 'WRIST',
            'CUELLO': 'NECK',
            'ESPALDA': 'BACK_GENERAL',
            'TOBILLO': 'ANKLE',
            'OTRO': null
        };
        return map[area];
    }

    /**
     * Generates a unique hash of current active constraints to detect changes.
     */
    public getConstraintsHash(user: UserProfile): string {
        const constraints = this.getActiveConstraints(user);
        return JSON.stringify(constraints);
    }

    /**
     * Builds the final list of banned tags and keywords based on:
     * 1. Fixed Profile Injuries (Rafa's defaults)
     * 2. Active Custom Injuries (ONLY if isActive is true)
     */
    public getActiveConstraints(user: UserProfile): TrainingConstraints {
        const bannedTags: Set<InjuryTag> = new Set();
        const bannedKeywords: Set<string> = new Set();

        // 1. Process Fixed Profile Injuries (Legacy string parsing)
        // These are assumed "Chronic" and always active unless we added a toggle for them (not yet)
        user.injuries.forEach(injStr => {
            const lower = injStr.toLowerCase();
            if (lower.includes('rodilla') || lower.includes('menisco') || lower.includes('ligamento')) bannedTags.add('KNEE');
            if (lower.includes('hombro')) bannedTags.add('SHOULDER');
            if (lower.includes('l5-s1') || lower.includes('lumbar') || lower.includes('espalda')) bannedTags.add('LUMBAR');
            if (lower.includes('cadera')) bannedTags.add('HIP');
        });

        // 2. Process Custom Injuries - FILTER BY ACTIVE
        // Reload strictly to ensure we have latest state
        const allCustom = this.getAll();
        const activeCustom = allCustom.filter(i => i.isActive);
        
        activeCustom.forEach(inj => {
            // Severity Logic:
            // 1-2: Mild. Maybe don't ban whole tag? For safety, we ban tag if severity >= 2.
            // 3-5: Moderate/Severe. Definitely ban tag.
            
            if (inj.severity >= 2) {
                const tag = this.mapAreaToTag(inj.bodyArea);
                if (tag) bannedTags.add(tag);
            }

            // Custom Avoid Keywords (e.g. "Overhead", "Salto")
            if (inj.avoidMovements && inj.avoidMovements.length > 0) {
                inj.avoidMovements.forEach(kw => bannedKeywords.add(kw.toLowerCase()));
            }

            // Heuristic Keywords based on Body Area (if user didn't specify keywords)
            if (inj.bodyArea === 'HOMBRO' && inj.severity >= 3) {
                bannedKeywords.add('press militar');
                bannedKeywords.add('trasnuca');
                bannedKeywords.add('fondos');
            }
            if (inj.bodyArea === 'RODILLA' && inj.severity >= 3) {
                bannedKeywords.add('salto');
                bannedKeywords.add('jump');
                bannedKeywords.add('profunda');
            }
            if (inj.bodyArea === 'LUMBAR' && inj.severity >= 3) {
                bannedKeywords.add('peso muerto');
                bannedKeywords.add('deadlift');
                bannedKeywords.add('hiperextension');
            }
        });

        return {
            bannedTags: Array.from(bannedTags),
            bannedKeywords: Array.from(bannedKeywords)
        };
    }
}

export const injuryService = new InjuryService();
