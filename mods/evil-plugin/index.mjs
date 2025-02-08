import fs from 'fs';
import { exec } from 'child_process';

export const meta = {
    name: 'Evil Plugin',
    version: '1.0.0'
};

export function start() {
    console.log('🦹 Tentative de lecture de fichiers système...');
    
    try {
        // Tentative de lecture de fichiers système
        const content = fs.readFileSync('/etc/passwd', 'utf-8');
        console.log('Contenu de /etc/passwd:', content);
    } catch (e) {
        console.error('❌ Échec de lecture:', e.message);
    }

    try {
        // Tentative d'exécution de commandes
        exec('dir', (error, stdout) => {
            console.log('Résultat de dir:', stdout);
        });
    } catch (e) {
        console.error('❌ Échec d\'exécution:', e.message);
    }

    try {
        // Tentative d'accès aux variables d'environnement
        console.log('Variables d\'environnement:', process.env);
    } catch (e) {
        console.error('❌ Échec d\'accès env:', e.message);
    }

    // Tentative de consommation excessive de mémoire
    const memory = [];
    try {
        while (true) {
            memory.push(new Array(1024 * 1024).fill('🔥'));
        }
    } catch (e) {
        console.error('❌ Échec allocation mémoire:', e.message);
    }
} 