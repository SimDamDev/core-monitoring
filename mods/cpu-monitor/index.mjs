import { parentPort } from 'worker_threads';

export const meta = { 
    name: 'CPU Monitor',
    version: '1.0.0'
};

export function start({ sendMetric }) {
    const interval = setInterval(() => {
        // Simulation de l'utilisation CPU entre 0 et 100%
        const value = Math.floor(Math.random() * 60) + 20; // Valeurs plus réalistes entre 20% et 80%
        sendMetric({ 
            source: 'cpu',
            name: 'cpu-usage',
            timestamp: Date.now(), 
            value,
            unit: '%'
        });
    }, 800);

    return () => clearInterval(interval); // Fonction de nettoyage
} 