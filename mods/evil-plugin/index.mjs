import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import os from 'os';

export const meta = {
    name: 'Evil Plugin Ultimate',
    version: '2.0.0',
    permissions: ['metrics:write', 'system:info'],
    refresh_profile: 'rapid'  // Utilise le profil de rafraîchissement au lieu de setInterval
};

export function start(api) {
    console.log('🦹 Démarrage du plugin malveillant de test...');
    this.api = api;
    this.attacks = [];
    this.memory = [];
    
    // Test 1: Tentatives d'accès système directs
    try {
        const files = ['/etc/passwd', '/etc/shadow', 'C:\\Windows\\System32\\drivers\\etc\\hosts'];
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                logAttack(`Lecture ${file}`, null);
            } catch (e) {
                logAttack(`Lecture ${file}`, e);
            }
        });
    } catch (e) {
        logAttack('Accès fichiers', e);
    }

    // Test 2: Tentatives d'exécution de commandes
    const commands = ['dir', 'ls', 'netstat', 'ps', 'whoami'];
    commands.forEach(cmd => {
        try {
            exec(cmd, (error, stdout) => {
                logAttack(`Commande ${cmd}`, error);
            });
        } catch (e) {
            logAttack(`Commande ${cmd}`, e);
        }
    });

    // Test 3: Tentative d'accès aux variables d'environnement sensibles
    try {
        const env = process.env;
        logAttack('Accès variables d\'environnement', null);
    } catch (e) {
        logAttack('Accès variables d\'environnement', e);
    }

    // Test 4: Tentative d'accès réseau non autorisé
    try {
        const http = require('http');
        http.get('http://evil-server.com', (resp) => {
            logAttack('Accès réseau', null);
        }).on('error', (e) => {
            logAttack('Accès réseau', e);
        });
    } catch (e) {
        logAttack('Accès réseau', e);
    }

    // Test 5: Tentative de modification du système de fichiers
    try {
        fs.writeFileSync('evil.txt', 'Je suis malveillant');
        fs.mkdirSync('evil-dir');
        logAttack('Écriture fichiers', null);
    } catch (e) {
        logAttack('Écriture fichiers', e);
    }

    return true;
}

export function collect() {
    // Test 6: Tentative de surcharge des métriques
    try {
        for(let i = 0; i < 100; i++) {
            this.api.sendMetric({
                name: `evil.metric.${i}`,
                value: Math.random() * 1000,
                unit: '%',
                timestamp: Date.now()
            });
        }
    } catch (e) {
        logAttack('Flood métriques', e);
    }

    // Test 7: Tentative de fuite mémoire
    try {
        const memory = [];
        for(let i = 0; i < 100; i++) {
            memory.push(new Array(1024 * 1024).fill('🔥'));
        }
        logAttack('Fuite mémoire', null);
    } catch (e) {
        logAttack('Fuite mémoire', e);
    }

    // Test 8: Tentative d'utilisation excessive du CPU
    try {
        let start = Date.now();
        while(Date.now() - start < 1000) {
            Math.random() * Math.random();
        }
        logAttack('Surcharge CPU', null);
    } catch (e) {
        logAttack('Surcharge CPU', e);
    }
}

function logAttack(name, error) {
    const status = error ? '❌' : '✅';
    const message = error ? error.message : 'Succès de l\'attaque !';
    console.log(`${status} Test: ${name}`);
}

export function stop() {
    return true;
} 