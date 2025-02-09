/**
 * Plugin de monitoring CPU pour IronMetrics
 * 
 * Ce plugin collecte les métriques d'utilisation CPU
 * et les envoie au pipeline de métriques.
 */

import { parentPort } from 'worker_threads';

export const meta = {
    name: 'CPU Monitor',
    version: '1.0.0',
    permissions: ['metrics:write']
};

export function start({ sendMetric }) {
    console.log('[CPU] 🚀 Démarrage monitoring...');
    
    // État initial
    let lastCpuInfo = process.cpuUsage();
    let lastTimestamp = Date.now();

    // Monitoring toutes les secondes
    const interval = setInterval(() => {
        try {
            const currentCpuInfo = process.cpuUsage();
            const currentTimestamp = Date.now();
            
            // Calcul de l'utilisation CPU
            const userDiff = currentCpuInfo.user - lastCpuInfo.user;
            const systemDiff = currentCpuInfo.system - lastCpuInfo.system;
            const timeDiff = currentTimestamp - lastTimestamp;
            
            // Calcul simple du pourcentage CPU (valeur entre 0 et 100)
            const cpuPercent = Math.min(100, Math.max(0, 
                Math.round((userDiff + systemDiff) / (timeDiff * 1000) * 100)
            ));

            console.log('[CPU] 📊 Utilisation CPU:', cpuPercent, '%');

            // Création de la métrique
            const metric = {
                source: 'cpu',
                name: 'cpu_usage',
                timestamp: currentTimestamp,
                value: cpuPercent,
                unit: '%'
            };

            console.log('[CPU] 📤 Envoi métrique:', metric);
            sendMetric(metric);

            // Mise à jour pour le prochain cycle
            lastCpuInfo = currentCpuInfo;
            lastTimestamp = currentTimestamp;
        } catch (error) {
            console.error('[CPU] ❌ ERREUR:', error);
        }
    }, 1000);

    // Fonction de nettoyage
    return () => {
        console.log('[CPU] 🛑 Arrêt monitoring');
        clearInterval(interval);
    };
} 