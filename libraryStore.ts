
import { UserFoodItem } from '../types';

const LIBRARY_KEY = 'rafafit:libraryItems';

class LibraryStore {
    private items: UserFoodItem[] = [];
    private isLoaded = false;

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem(LIBRARY_KEY);
            this.items = stored ? JSON.parse(stored) : [];
            this.isLoaded = true;
        } catch (e) {
            console.error("Error loading library", e);
            this.items = [];
        }
    }

    private save() {
        try {
            localStorage.setItem(LIBRARY_KEY, JSON.stringify(this.items));
        } catch (e) {
            console.error("Error saving library", e);
        }
    }

    public getItems(): UserFoodItem[] {
        if (!this.isLoaded) this.load();
        // Return verification first, then alphabetical
        return [...this.items].sort((a, b) => {
            if (a.status === b.status) return a.name.localeCompare(b.name);
            return a.status === 'PENDING' ? -1 : 1;
        });
    }

    public getVerifiedItems(): UserFoodItem[] {
        if (!this.isLoaded) this.load();
        return this.items.filter(i => i.status === 'VERIFIED');
    }

    public addItem(item: UserFoodItem) {
        // Prevent exact duplicates by ID
        if (this.items.some(i => i.id === item.id)) return;
        
        // Prevent duplicate names (simple)
        const nameExists = this.items.some(i => i.name.toLowerCase() === item.name.toLowerCase());
        
        if (!nameExists) {
            this.items.push(item);
            this.save();
        }
    }

    public updateItem(id: string, updates: Partial<UserFoodItem>) {
        this.items = this.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
        );
        this.save();
    }

    public removeItem(id: string) {
        this.items = this.items.filter(i => i.id !== id);
        this.save();
    }

    public getPendingCount(): number {
        return this.items.filter(i => i.status === 'PENDING').length;
    }
}

export const libraryStore = new LibraryStore();
