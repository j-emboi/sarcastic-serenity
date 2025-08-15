export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'hold2';

export type BreathingAnimationType = 
  | 'expanding-circle'    // Simple expanding/contracting circle
  | 'wave-pulse'          // Ripple effects that expand outward
  | 'particle-flow'       // Particles that flow in/out
  | 'geometric-shapes'    // Shapes that transform
  | 'nature-flower'       // Flower blooming/closing
  | 'minimalist-lines'    // Simple lines or dots
  | 'ocean-waves';        // Ocean wave effects

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number; // seconds
  hold: number; // seconds
  exhale: number; // seconds
  hold2?: number; // optional second hold (for 4-7-8 pattern)
  cycles: number; // number of complete cycles
  category: 'relaxation' | 'energy' | 'focus' | 'sleep' | 'stress-relief';
}

export interface BreathingState {
  isActive: boolean;
  currentPhase: BreathingPhase;
  timeRemaining: number; // seconds remaining in current phase
  cycleCount: number; // current cycle (1-based)
  totalCycles: number;
  elapsedTime: number; // total time elapsed in session
  pattern: BreathingPattern;
}

export interface BreathingCallbacks {
  onPhaseChange?: (phase: BreathingPhase) => void;
  onCycleComplete?: (cycle: number) => void;
  onSessionComplete?: () => void;
  onTimeUpdate?: (timeRemaining: number, phase: BreathingPhase) => void;
}

// Enhanced breathing patterns with categories
export const BREATHING_PATTERNS: BreathingPattern[] = [
  // Relaxation Patterns
  { 
    id: 'box', 
    name: 'Box Breathing', 
    description: 'Equal inhale, hold, exhale, hold (4-4-4-4) - Perfect for stress relief and focus', 
    inhale: 4, hold: 4, exhale: 4, hold2: 4, cycles: 10,
    category: 'relaxation'
  },
  { 
    id: 'relaxation', 
    name: '4-7-8 Breathing', 
    description: 'Deep relaxation pattern (4-7-8) - Great for falling asleep and anxiety relief', 
    inhale: 4, hold: 7, exhale: 8, cycles: 8,
    category: 'relaxation'
  },
  { 
    id: 'calm', 
    name: 'Calm Breathing', 
    description: 'Gentle 4-4-4 pattern - Simple and soothing for daily relaxation', 
    inhale: 4, hold: 4, exhale: 4, cycles: 10,
    category: 'relaxation'
  },
  
  // Energy Patterns
  { 
    id: 'energy', 
    name: 'Energy Breathing', 
    description: 'Quick energizing pattern (3-1-3-1) - Boost alertness and vitality', 
    inhale: 3, hold: 1, exhale: 3, hold2: 1, cycles: 12,
    category: 'energy'
  },
  { 
    id: 'power', 
    name: 'Power Breathing', 
    description: 'Intense energizing pattern (2-1-2-1) - Maximum energy boost', 
    inhale: 2, hold: 1, exhale: 2, hold2: 1, cycles: 15,
    category: 'energy'
  },
  
  // Focus Patterns
  { 
    id: 'focus', 
    name: 'Focus Breathing', 
    description: 'Concentration pattern (5-5-5) - Enhance mental clarity and focus', 
    inhale: 5, hold: 5, exhale: 5, cycles: 8,
    category: 'focus'
  },
  { 
    id: 'mindful', 
    name: 'Mindful Breathing', 
    description: 'Mindfulness pattern (6-2-7) - Deep awareness and presence', 
    inhale: 6, hold: 2, exhale: 7, cycles: 6,
    category: 'focus'
  },
  
  // Sleep Patterns
  { 
    id: 'sleep', 
    name: 'Sleep Breathing', 
    description: 'Deep sleep pattern (4-6-4) - Prepare your body for rest', 
    inhale: 4, hold: 6, exhale: 4, cycles: 6,
    category: 'sleep'
  },
  { 
    id: 'deep-sleep', 
    name: 'Deep Sleep', 
    description: 'Intense sleep pattern (3-7-5) - For deep, restorative sleep', 
    inhale: 3, hold: 7, exhale: 5, cycles: 5,
    category: 'sleep'
  },
  
  // Stress Relief Patterns
  { 
    id: 'stress-relief', 
    name: 'Stress Relief', 
    description: 'Quick stress relief (5-3-6) - Calm your nervous system', 
    inhale: 5, hold: 3, exhale: 6, cycles: 7,
    category: 'stress-relief'
  },
  { 
    id: 'anxiety', 
    name: 'Anxiety Relief', 
    description: 'Anxiety reduction (4-8-6) - Soothe anxious thoughts', 
    inhale: 4, hold: 8, exhale: 6, cycles: 6,
    category: 'stress-relief'
  }
];

// Breathing animation descriptions
export const BREATHING_ANIMATIONS: { type: BreathingAnimationType; name: string; description: string }[] = [
  { type: 'expanding-circle', name: 'Expanding Circle', description: 'Simple circle that grows and shrinks with your breath' },
  { type: 'wave-pulse', name: 'Wave Pulse', description: 'Ripple effects that expand outward like waves' },
  { type: 'particle-flow', name: 'Particle Flow', description: 'Dynamic particles that flow in and out with breathing' },
  { type: 'geometric-shapes', name: 'Geometric Shapes', description: 'Abstract shapes that transform with each breath' },
  { type: 'nature-flower', name: 'Nature Flower', description: 'Beautiful flower that blooms and closes naturally' },
  { type: 'minimalist-lines', name: 'Minimalist Lines', description: 'Clean, simple lines for a zen-like experience' },
  { type: 'ocean-waves', name: 'Ocean Waves', description: 'Soothing ocean wave patterns that ebb and flow' }
];

// Helper function to get patterns by category
export function getPatternsByCategory(category: BreathingPattern['category']): BreathingPattern[] {
  return BREATHING_PATTERNS.filter(pattern => pattern.category === category);
}

// Helper function to get pattern by ID
export function getPatternById(id: string): BreathingPattern | undefined {
  return BREATHING_PATTERNS.find(pattern => pattern.id === id);
}
