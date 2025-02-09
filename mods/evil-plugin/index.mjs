import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import os from 'os';

export const meta = {
    name: 'Evil Plugin Ultimate',
    version: '2.0.0',
    permissions: ['metrics:write', 'system:info'] // On demande des permissions légitimes
};

let attacks = [];
let isRunning = false;
let attackInterval;

function logAttack(name, error) {
    const status = error ? '❌' : '✅';
    const message = error ? error.message : 'Succès de l\'attaque !';
    attacks.push(`${status} ${name}: ${message}`);
    console.log(`${status} Test: ${name}`);
}

// Séparation des attaques en fonctions individuelles
function testFileSystem() {
    const files = ['/etc/passwd', '/etc/shadow', 'C:\\Windows\\System32\\drivers\\etc\\hosts'];
    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            logAttack(`Lecture ${file}`, null);
        } catch (e) {
            logAttack(`Lecture ${file}`, e);
        }
    });
}

function testCommands() {
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
}

function testEnvVars() {
    try {
        const env = process.env;
        logAttack('Accès variables d\'environnement', null);
    } catch (e) {
        logAttack('Accès variables d\'environnement', e);
    }
}

function testNetwork() {
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
}

function testFileWrite() {
    try {
        fs.writeFileSync('evil.txt', 'Je suis malveillant');
        fs.mkdirSync('evil-dir');
        logAttack('Écriture fichiers', null);
    } catch (e) {
        logAttack('Écriture fichiers', e);
    }
}

function testMemoryLeak() {
    try {
        const memory = [];
        for(let i = 0; i < 100; i++) {
            memory.push(new Array(1024 * 1024).fill('🔥'));
        }
        logAttack('Fuite mémoire', null);
    } catch (e) {
        logAttack('Fuite mémoire', e);
    }
}

function testCPUOverload() {
    try {
        let start = Date.now();
        while(Date.now() - start < 5000) {
            Math.random() * Math.random();
        }
        logAttack('Surcharge CPU', null);
    } catch (e) {
        logAttack('Surcharge CPU', e);
    }
}

export function start(api) {
    console.log('🦹 Démarrage du plugin malveillant de test...');
    this.api = api;
    attacks = [];
    isRunning = true;

    // Exécution séquentielle des attaques
    testFileSystem();
    testCommands();
    testEnvVars();
    testNetwork();
    testFileWrite();
    
    // Tests périodiques
    attackInterval = setInterval(() => {
        if (!isRunning) return;

        // Test de flood de métriques
        try {
            for(let i = 0; i < 100; i++) {
                this.api.sendMetric({
                    name: `evil.metric.${i}`,
                    value: Math.random() * 1000,
                    unit: 'count',
                    timestamp: Date.now()
                });
            }
        } catch (e) {
            logAttack('Flood métriques', e);
        }

        // Tests de ressources système
        testMemoryLeak();
        testCPUOverload();
    }, 5000);

    return true;
}

export function collect() {
    if (!isRunning) return;
    
    // Test de surcharge dans collect()
    try {
        let start = Date.now();
        while(Date.now() - start < 1000) {
            Math.random() * Math.random();
        }
    } catch (e) {
        logAttack('Surcharge collect()', e);
    }
}

export function stop() {
    isRunning = false;
    if (attackInterval) {
        clearInterval(attackInterval);
    }
    
    console.log('\n📊 Rapport final des attaques testées:');
    console.log('=====================================');
    attacks.forEach(attack => console.log(attack));
    return true;
} 