
import { ExerciseVideo } from '../types';

/**
 * Regex to extract YouTube ID from:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/shorts/ID
 * - youtube.com/embed/ID
 */
const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

/**
 * Extracts the 11-char YouTube ID.
 */
export const extractYouTubeId = (url: string): string | null => {
    const match = url.match(YOUTUBE_ID_REGEX);
    return match ? match[1] : null;
};

/**
 * Builds a standardized "watch" URL.
 * Always returns https://www.youtube.com/watch?v=ID
 */
export const buildYouTubeWatchUrl = (videoId: string, startSec?: number): string => {
    let url = `https://www.youtube.com/watch?v=${videoId}`;
    if (startSec && startSec > 0) {
        url += `&t=${startSec}s`;
    }
    return url;
};

/**
 * Builds a "Search on YouTube" URL (fallback).
 */
export const buildSearchUrl = (query: string): string => {
    const encoded = encodeURIComponent(query + " técnica correcta español");
    return `https://www.youtube.com/results?search_query=${encoded}`;
};

/**
 * Formats seconds into MM:SS
 */
export const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Converts a potentially messy input URL into a clean normalized ExerciseVideo object
 */
export const normalizeVideoInput = (rawUrl: string, startSec?: number): Partial<ExerciseVideo> | null => {
    const id = extractYouTubeId(rawUrl);
    if (!id) return null;

    return {
        provider: 'youtube',
        url: buildYouTubeWatchUrl(id, startSec),
        startSec
    };
};
