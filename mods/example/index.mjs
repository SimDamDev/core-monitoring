/**
 * Plugin d'exemple pour IronMetrics
 * 
 * Ce plugin montre comment :
 * 1. Définir les métadonnées requises
 * 2. Implémenter la fonction start
 * 3. Envoyer des métriques
 * 4. Nettoyer les ressources
 */

export const meta = {
    name: 'Plugin Exemple',
    version: '1.0.0'
};

/**
 * Fonction de démarrage du plugin
 * @param {Object} context - Contexte fourni par IronMetrics
 * @param {Function} context.sendMetric - Fonction pour envoyer une métrique
 * @returns {Function} Fonction de nettoyage
 */
export function start({ sendMetric }) {
    console.log('Démarrage du plugin exemple');

    // Exemple d'envoi périodique de métriques
    const interval = setInterval(() => {
        // Création d'une métrique valide
        sendMetric({
            source: 'example',           // ID unique du plugin (défini dans mod.yml)
            name: 'example-metric',      // Nom descriptif de la métrique
            timestamp: Date.now(),       // Timestamp en millisecondes
            value: Math.random() * 100,  // Valeur numérique
            unit: '%'                    // Unité (%, ms, MB)
        });
    }, 1000);

    // Retourne une fonction de nettoyage
    return () => {
        console.log('Arrêt du plugin exemple');
        clearInterval(interval);
    };
} 