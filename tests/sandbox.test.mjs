import { PluginSandbox } from '../core/sandbox.mjs';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('PluginSandbox', () => {
    let consoleSpy;
    let sandbox;
    
    beforeEach(() => {
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation()
        };
    });

    afterEach(async () => {
        if (sandbox) {
            await sandbox.stop();
            sandbox = null;
        }
    });

    it('démarre un plugin valide avec succès', async () => {
        const validPlugin = `
            exports.meta = {
                name: 'test-plugin',
                version: '1.0.0'
            };
            exports.start = async (context) => {
                console.log('Plugin démarré');
                if (context.sendMetric) {
                    context.sendMetric({
                        timestamp: Date.now(),
                        name: 'test-metric',
                        value: 42,
                        unit: 'count'
                    });
                }
            };
        `;

        sandbox = new PluginSandbox(validPlugin, {
            id: 'test-plugin',
            permissions: ['metrics:write']
        });

        let metricReceived = false;
        sandbox.on('metric', (metric) => {
            expect(metric).toMatchObject({
                name: 'test-metric',
                value: 42,
                unit: 'count',
                source: 'test-plugin'
            });
            metricReceived = true;
        });

        await sandbox.start();
        expect(consoleSpy.log).toHaveBeenCalledWith(
            '[Plugin test-plugin]',
            'Plugin démarré'
        );
        expect(metricReceived).toBe(true);
    });

    it('bloque les appels système non autorisés', async () => {
        const maliciousPlugin = `
            exports.meta = { name: 'malicious', version: '1.0.0' };
            exports.start = () => {
                try {
                    process.exit(1);
                } catch (e) {
                    console.error('Erreur attendue:', e.message);
                }
            };
        `;

        sandbox = new PluginSandbox(maliciousPlugin, {
            id: 'malicious',
            permissions: []
        });

        await sandbox.start();
        expect(process.exitCode).not.toBe(1);
    }, 10000);

    it('vérifie les permissions pour l\'envoi de métriques', async () => {
        const plugin = `
            exports.meta = { name: 'test', version: '1.0.0' };
            exports.start = (context) => {
                if (!context.sendMetric) {
                    console.log('Pas de permission metrics:write');
                }
            };
        `;

        sandbox = new PluginSandbox(plugin, {
            id: 'test',
            permissions: []
        });

        await sandbox.start();
        expect(consoleSpy.log).toHaveBeenCalledWith(
            '[Plugin test]',
            'Pas de permission metrics:write'
        );
    });

    it('permet l\'accès aux APIs système avec les bonnes permissions', async () => {
        const plugin = `
            exports.meta = { name: 'system-info', version: '1.0.0' };
            exports.start = () => {
                if (system) {
                    const uptime = system.uptime();
                    console.log('Uptime:', uptime);
                }
            };
        `;

        sandbox = new PluginSandbox(plugin, {
            id: 'system-info',
            permissions: ['system:info']
        });

        await sandbox.start();
        expect(consoleSpy.log).toHaveBeenCalledWith(
            '[Plugin system-info]',
            'Uptime:',
            expect.any(Number)
        );
    });

    it('gère le timeout des scripts trop longs', async () => {
        const longRunningPlugin = `
            exports.meta = { name: 'timeout', version: '1.0.0' };
            exports.start = () => {
                while(true) {} // Boucle infinie
            };
        `;

        sandbox = new PluginSandbox(longRunningPlugin, {
            id: 'timeout',
            permissions: []
        });

        await expect(sandbox.start()).rejects.toThrow('Timeout du plugin');
    }, 10000);

    it('arrête proprement le sandbox', async () => {
        const plugin = `
            exports.meta = { name: 'stop-test', version: '1.0.0' };
            exports.start = () => {
                console.log('Démarré');
            };
        `;

        sandbox = new PluginSandbox(plugin, {
            id: 'stop-test',
            permissions: []
        });

        await sandbox.start();
        await sandbox.stop();
        
        expect(sandbox.worker).toBeNull();
    });
}); 