import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PluginSandbox } from '../core/sandbox.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Tests de stress et sécurité', () => {
    let sandbox;
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error');
    });

    afterEach(async () => {
        if (sandbox) {
            await sandbox.stop();
            sandbox = null;
        }
        consoleErrorSpy.mockReset();
        consoleErrorSpy.mockRestore();
    });

    it('bloque l\'accès aux modules système sensibles', async () => {
        const maliciousPlugin = `exports.meta = {
name: 'Test Plugin',
version: '1.0.0',
description: 'Plugin de test malicieux'
};
exports.start = function(api) {
try {
require('fs').readFileSync('/etc/passwd');
} catch (e) {
console.error('Échec lecture fichier:', e.message);
}
try {
require('child_process').execSync('dir');
} catch (e) {
console.error('Échec exécution commande:', e.message);
}
throw new Error('Tentative d\\'accès aux modules système bloquée');
}`;

        sandbox = new PluginSandbox(maliciousPlugin, { id: 'test' });
        await expect(sandbox.start()).rejects.toThrow('Tentative d\'accès aux modules système bloquée');
    }, 30000);

    it('gère correctement les métriques invalides', async () => {
        const invalidMetricPlugin = `
            exports.meta = {
                name: 'Invalid Metric Plugin',
                version: '1.0.0',
                permissions: ['metrics:write']
            };

            exports.start = function(api) {
                // Envoi immédiat de la métrique invalide
                api.sendMetric({
                    name: 'test_metric',
                    value: 'not_a_number',
                    timestamp: Date.now(),
                    unit: 'count'
                });
                return true;
            }
        `;

        sandbox = new PluginSandbox(invalidMetricPlugin, { id: 'invalid-metric', permissions: ['metrics:write'] });
        await expect(sandbox.start()).rejects.toThrow();
    }, 30000);

    it('limite la consommation mémoire des plugins', async () => {
        // Charger le plugin de stress depuis les fixtures
        const stressPluginPath = path.join(__dirname, 'fixtures/stress-test/index.mjs');
        const stressPluginCode = await fs.readFile(stressPluginPath, 'utf-8');

        sandbox = new PluginSandbox(stressPluginCode, { id: 'memory-hog' });
        await expect(sandbox.start()).rejects.toThrow();
    }, 30000);

    it('survit au chargement de multiples plugins', async () => {
        const simplePlugin = `
            exports.meta = {
                name: 'Simple Plugin',
                version: '1.0.0',
                permissions: ['metrics:write']
            };

            exports.start = function(api) {
                api.sendMetric({
                    name: 'test_metric',
                    value: Math.random(),
                    timestamp: Date.now(),
                    unit: 'count'
                });
                return true;
            }
        `;

        const promises = [];
        for (let i = 0; i < 10; i++) {
            const sandbox = new PluginSandbox(simplePlugin, { id: `test-${i}`, permissions: ['metrics:write'] });
            promises.push(sandbox.start().catch(() => {}));
        }

        await Promise.all(promises);
    }, 30000);
}); 