
import { ExerciseVideo, TrainingSession, ExerciseBase } from '../types';
import { VIDEO_DB } from '../data/videoDb';
import { getCachedVideo, setCachedVideo, markVideoBroken } from '../utils/videoCacheStore';
import { extractYouTubeId, buildYouTubeWatchUrl } from '../utils/videoUrl.ts';

/**
 * Generates a stable unique key for any item in a session.
 */
export const generateVideoKey = (
    sessionType: string, 
    sessionSubtype: string | undefined, 
    exercise?: ExerciseBase
): string => {
    if (exercise && exercise.id) {
        return `ex:${exercise.id}`;
    }
    
    // For Cardio/Sport without specific exercises
    if (sessionType === 'CARDIO' || sessionType === 'SPORT') {
        const sub = (sessionSubtype || 'general').toLowerCase().trim();
        return `cx:${sessionType.toLowerCase()}:${sub}`;
    }

    return `cx:manual:${sessionType.toLowerCase()}`;
};

/**
 * Main Resolver Function
 * Priority: 
 * 1. Cache (LocalStorage)
 * 2. Local DB (Hardcoded verified videos)
 * 3. Fallback (Returns null, UI handles "Search on YouTube")
 */
export const resolveVideoForItem = async (
    key: string, 
    searchTerm: string // Used if we were to implement real AutoSearch
): Promise<ExerciseVideo | null> => {
    
    // 1. Check Cache
    const cached = getCachedVideo(key);
    if (cached) return cached;

    // 2. Check Local DB
    const dbVideo = VIDEO_DB[key];
    if (dbVideo) {
        setCachedVideo(key, dbVideo);
        return dbVideo;
    }

    // 3. AutoSearch (Simulated)
    // Since we don't have a YouTube API key in environment, we cannot strictly "Search".
    // However, if the exercise object passed has a legacy 'video' field, we can migrate it.
    // (This step assumes the key generation might be called with context, but here we just have key)
    
    // FUTURE: If we had a backend or proxy, we would fetch here.
    // For now, we return null to trigger the "1-Click Search" UI.
    
    return null; 
};

/**
 * Handles marking a video as broken and attempting to re-resolve (or clearing cache)
 */
export const reportVideoBroken = async (key: string) => {
    markVideoBroken(key);
    // In a real app, this might trigger a report to backend.
    // Here, we just clear it from cache so the UI falls back to "Search".
};
