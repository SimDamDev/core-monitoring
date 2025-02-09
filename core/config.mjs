export const REFRESH_PROFILES = {
  off: 0,        // Jamais
  low: 300_000,  // 5 min
  default: 60_000, // 1 min
  rapid: 5_000   // 5 sec
};

// Valeurs par défaut
export const DEFAULT_CONFIG = {
  refresh_profile: 'default'
}; 