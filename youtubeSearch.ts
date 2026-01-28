
export type SearchKind = 'exercise' | 'circuit' | 'cardio' | 'sport';

/**
 * Builds an optimized YouTube search URL.
 * Appends specific keywords based on the activity kind to ensure high-quality results in Spanish.
 */
export const buildYouTubeSearchUrl = (title: string, kind: SearchKind = 'exercise'): string => {
    // Basic cleanup: remove parentheses often used for internal notes e.g., "Prensa (Inclinada)" -> "Prensa"
    // to broaden search results, or keep them if they are specific. 
    // Usually, keeping them is fine for YouTube search, but let's ensure we target "técnica".
    
    let suffix = 'técnica correcta español';
    
    switch (kind) {
        case 'circuit':
            suffix += ' ejercicios en casa';
            break;
        case 'cardio':
            suffix = 'técnica correcta'; // Less specific for generic cardio
            break;
        case 'sport':
            suffix = 'consejos principiantes español';
            break;
        case 'exercise':
        default:
            suffix = 'técnica correcta gym español';
            break;
    }

    const query = `${title} ${suffix}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};

/**
 * Opens the search in a new tab safely.
 */
export const openYouTubeSearch = (title: string, kind: SearchKind = 'exercise') => {
    const url = buildYouTubeSearchUrl(title, kind);
    window.open(url, '_blank', 'noopener,noreferrer');
};
