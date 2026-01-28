
import { ExerciseVideo } from '../types';

/**
 * LOCAL VIDEO DATABASE (Spanish)
 * Keys are formatted as:
 * - "ex:{exerciseId}" for specific DB exercises
 * - "cx:{type}:{subtype}" for general activities (cardio, sport)
 * - "cx:manual:{slug}" for manual entries
 */
export const VIDEO_DB: Record<string, ExerciseVideo> = {
  // --- GYM MACHINES ---
  "ex:gym_leg_press": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=yZMx_9xO9Tq", startSec: 45 
  },
  "ex:gym_chest_press": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=S8pBBS_bL2M", startSec: 0 
  },
  "ex:gym_lat_pull": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", startSec: 10 
  },
  "ex:gym_seated_row": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=GZbfZ033fMw", startSec: 0 
  },
  "ex:gym_shoulder_press_machine": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=WvLMauqtCw4", startSec: 0 
  },
  "ex:gym_face_pull": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=VlS9ZJ1Gq_c", startSec: 162, notes: "Clave para hombro" 
  },
  "ex:gym_leg_ext": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=YyvSfVjQWuA", startSec: 0 
  },

  // --- BANDS ---
  "ex:band_row": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=6rV8xZ7g_6Q", startSec: 0 
  },
  "ex:band_chest_press": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=Ff6_8vQZJ4g", startSec: 0 
  },
  "ex:band_squat": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=8kK0v4H6d4g", startSec: 0 
  },
  "ex:band_pallof": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=5_J2_aG6_6Q", startSec: 0, notes: "Anti-rotación core" 
  },
  "ex:band_pull_apart": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=okM3vWzQ-g0", startSec: 0 
  },

  // --- CIRCUIT / BODYWEIGHT ---
  "ex:circ_glute_bridge": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=8bbE64NuDTU", startSec: 0 
  },
  "ex:circ_step_up": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=d8idrF5Q7pU", startSec: 0 
  },
  "ex:circ_plank": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=ASdvN_XEl_c", startSec: 0 
  },
  "ex:circ_bird_dog": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=wiFNA3sqjCA", startSec: 0 
  },
  "ex:dead_bug": {
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=I5xbsA71v1A", startSec: 0
  },

  // --- CARDIO & SPORT ---
  "cx:cardio:walk": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=_HAnSaeYQKs", startSec: 0, notes: "Técnica marcha rápida" 
  },
  "cx:sport:padel": { 
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=3-M4x4_u5Fw", startSec: 0, notes: "Consejos básicos pádel" 
  },
  "cx:cardio:bike": {
      provider: 'youtube', source: 'localDb', language: 'es', 
      url: "https://www.youtube.com/watch?v=4dF-Hj0_10o", startSec: 0, notes: "Ajuste bici estática"
  }
};
