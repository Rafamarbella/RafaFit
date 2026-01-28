
import { ExerciseVideo } from '../types';

const VIDEO_OVERRIDES_KEY = 'rafa_video_overrides';

/**
 * Builds a final URL that includes the timestamp.
 * Handles standard YouTube URLs and short URLs (youtu.be).
 */
export const buildVideoUrl = (video: ExerciseVideo): string => {
    let finalUrl = video.url.trim();
    
    if (video.startSec && video.startSec > 0) {
        // Check if URL already has query params
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}t=${video.startSec}`;
    }
    
    return finalUrl;
};

/**
 * Formats seconds into MM:SS for display
 */
export const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

/**
 * STORAGE: Get effective video for an exercise.
 * Priority: 1. Local Override -> 2. Core DB Definition
 */
export const getEffectiveVideo = (exerciseId: string, defaultVideo?: ExerciseVideo): ExerciseVideo | undefined => {
    try {
        const stored = localStorage.getItem(VIDEO_OVERRIDES_KEY);
        if (stored) {
            const overrides = JSON.parse(stored);
            if (overrides[exerciseId]) {
                return overrides[exerciseId];
            }
        }
    } catch (e) {
        console.error("Error loading video overrides", e);
    }
    return defaultVideo;
};

/**
 * STORAGE: Save a video override for a specific exercise.
 */
export const saveVideoOverride = (exerciseId: string, video: ExerciseVideo) => {
    try {
        const stored = localStorage.getItem(VIDEO_OVERRIDES_KEY);
        const overrides = stored ? JSON.parse(stored) : {};
        
        overrides[exerciseId] = video;
        localStorage.setItem(VIDEO_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
        console.error("Error saving video override", e);
    }
};
