
import { ExerciseVideo } from '../types';

const CACHE_KEY = 'rafa_video_cache_v2';

interface VideoCache {
    [key: string]: ExerciseVideo;
}

const loadCache = (): VideoCache => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

const saveCache = (cache: VideoCache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Video cache quota exceeded");
    }
};

export const getCachedVideo = (key: string): ExerciseVideo | null => {
    const cache = loadCache();
    const video = cache[key];
    
    // If marked broken, behave as if not found so we can try fallback/retry strategies
    if (video && video.broken) return null;
    
    return video || null;
};

export const setCachedVideo = (key: string, video: ExerciseVideo) => {
    const cache = loadCache();
    cache[key] = {
        ...video,
        lastCheckedAt: new Date().toISOString()
    };
    saveCache(cache);
};

export const markVideoBroken = (key: string) => {
    const cache = loadCache();
    if (cache[key]) {
        cache[key].broken = true;
        saveCache(cache);
    }
};

export const clearVideoCache = () => {
    localStorage.removeItem(CACHE_KEY);
};
