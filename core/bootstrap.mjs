// Gestionnaire d'erreurs global
function logFatal(error, message) {
    console.error('🔥 FATAL:', message);
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);
}

// Handler pour les erreurs non capturées
process.on('uncaughtException', (error) => {
    logFatal(error, 'ERREUR NON CAPTUREE - Redemarrage gracieux');
    setTimeout(() => process.exit(1), 1000);
});

// Handler pour les rejets de promesses non gérés
process.on('unhandledRejection', (error) => {
    logFatal(error, 'PROMESSE REJETEE NON GEREE - Redemarrage gracieux');
    setTimeout(() => process.exit(1), 1000);
});

// Limites de ressources par défaut pour les workers
export const WORKER_RESOURCE_LIMITS = {
    stackSizeKB: 512,
    codeRangeSizeMB: 1,
    maxOldGenerationSizeMB: 16
}; 