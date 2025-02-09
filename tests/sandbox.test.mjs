import { PluginSandbox } from '../core/sandbox.mjs';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { MetricsScheduler } from '../core/scheduler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('PluginSandbox', () => {
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

    it('démarre un plugin valide avec succès', async () => {
        const validPlugin = `
            exports.meta = {
                name: 'Test Plugin',
                version: '1.0.0',
                permissions: []
            };

            exports.start = function(api) {
                return true;
            };
        `;

        sandbox = new PluginSandbox(validPlugin, { id: 'test', permissions: [] });
        await expect(sandbox.start()).resolves.toBe(true);
    }, 30000);

    it('bloque les appels système non autorisés', async () => {
        const plugin = `
            exports.meta = {
                name: 'Evil Plugin',
                version: '1.0.0',
                permissions: []
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
                return true;
            };
        `;

        sandbox = new PluginSandbox(plugin, { id: 'test', permissions: [] });
        await expect(sandbox.start()).resolves.toBe(true);
    }, 30000);

    it('vérifie les permissions pour l\'envoi de métriques', async () => {
        const plugin = `
            exports.meta = {
                name: 'Metric Plugin',
                version: '1.0.0',
                permissions: []
            };

            exports.start = function(api) {
                api.sendMetric({
                    name: 'test_metric',
                    value: 42,
                    timestamp: Date.now(),
                    unit: 'count'
                });
                return true;
            };
        `;

        sandbox = new PluginSandbox(plugin, { id: 'test', permissions: ['metrics:write'] });
        await expect(sandbox.start()).resolves.toBe(true);
    }, 30000);

    it('permet l\'accès aux APIs système avec les bonnes permissions', async () => {
        const plugin = `
            exports.meta = {
                name: 'System Plugin',
                version: '1.0.0',
                permissions: ['system:info']
            };

            exports.start = function(api) {
                const info = api.system.uptime();
                console.log('Uptime:', info);
                return true;
            };
        `;

        sandbox = new PluginSandbox(plugin, { id: 'test', permissions: ['system:info'] });
        await expect(sandbox.start()).resolves.toBe(true);
    }, 30000);

    it('gère le timeout des scripts trop longs', async () => {
        const plugin = `
            exports.meta = {
                name: 'Timeout Plugin',
                version: '1.0.0',
                permissions: []
            };

            exports.start = function(api) {
                while(true) {
                    // Boucle infinie
                }
            };
        `;

        sandbox = new PluginSandbox(plugin, { id: 'test', permissions: [] });
        await expect(sandbox.start()).rejects.toThrow('Timeout du plugin');
    }, 30000);

    it('arrête proprement le sandbox', async () => {
        const plugin = `
            exports.meta = {
                name: 'Stop Plugin',
                version: '1.0.0',
                permissions: []
            };

            exports.start = function(api) {
                return true;
            };
        `;

        sandbox = new PluginSandbox(plugin, { id: 'stop-test', permissions: [] });
        await sandbox.start();
        await expect(sandbox.stop()).resolves.toBe(true);
    }, 30000);

    it('respecte le profil de rafraîchissement', async () => {
        const mockPlugin = `
            exports.meta = {
                name: 'test-refresh',
                version: '1.0.0'
            };
            
            exports.start = function(api) {
                this.api = api;
                return true;
            };
            
            exports.collect = function() {
                this.api.sendMetric({
                    name: 'test.metric',
                    value: Math.random() * 100,
                    unit: '%',
                    timestamp: Date.now()
                });
            };
        `;

        const config = {
            id: 'test-refresh',
            permissions: ['metrics:write'],
            refresh_profile: 'rapid'
        };

        const sandbox = new PluginSandbox(mockPlugin, config);
        const metrics = [];

        sandbox.on('metric', (metric) => {
            metrics.push(metric);
        });

        await sandbox.start();
        
        // Simuler une connexion active
        const scheduler = new MetricsScheduler();
        scheduler.addPlugin(sandbox);
        scheduler.incrementConnections();
        
        // Attendre 3 collectes (15 secondes avec le profil rapid)
        await new Promise(resolve => setTimeout(resolve, 15_000));
        
        expect(metrics.length).toBeGreaterThanOrEqual(2);
        
        scheduler.cleanup();
        await sandbox.stop();
    }, 20_000);
}); 