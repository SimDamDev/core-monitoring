/**
 * Plugin de monitoring CPU pour IronMetrics
 * 
 * Ce plugin collecte les métriques d'utilisation CPU
 * et les envoie au pipeline de métriques.
 */

export const meta = {
    name: 'CPU Monitor',
    description: 'Moniteur de charge CPU'
};

export function start(api) {
    this.api = api;
    this.lastCpuUsage = this.api.system.cpuUsage();
    this.lastTimestamp = Date.now();
    console.log('🔄 Démarrage du moniteur CPU');
    return Promise.resolve(true);
}

export function collect() {
    const currentCpuUsage = this.api.system.cpuUsage();
    const currentTimestamp = Date.now();
    
    // Calcul du pourcentage d'utilisation
    const userDiff = currentCpuUsage.user - this.lastCpuUsage.user;
    const sysDiff = currentCpuUsage.system - this.lastCpuUsage.system;
    const elapsed = currentTimestamp - this.lastTimestamp;
    
    // Mise à jour des valeurs pour la prochaine collecte
    this.lastCpuUsage = currentCpuUsage;
    this.lastTimestamp = currentTimestamp;
    
    // Calcul du pourcentage total (user + system)
    const totalPercent = Math.min(100, ((userDiff + sysDiff) / (elapsed * 1000)) * 100);
    
    // Envoi de la métrique
    this.api.sendMetric({
        timestamp: Date.now(),
        name: 'cpu_usage',
        value: totalPercent,
        unit: '%'
    });
} 