export const meta = {
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'Un plugin d\'exemple pour montrer la structure de base',
    permissions: ['metrics:write']
};

export function start(api) {
    console.log('📚 Démarrage du plugin d\'exemple');
    this.api = api;
    return true;
}

export function collect() {
    // Exemple d'envoi d'une métrique
    this.api.sendMetric({
        name: 'example.usage',
        value: Math.random() * 100,
        unit: '%',
        timestamp: Date.now()
    });
}

export function stop() {
    console.log('👋 Arrêt du plugin d\'exemple');
    return true;
} 