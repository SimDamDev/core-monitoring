import { PluginSandbox } from '../core/sandbox.mjs';
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('PluginSandbox', () => {
    test('gère correctement un plugin qui crash', async () => {
        const crashingPluginPath = path.join(__dirname, 'fixtures', 'crashing-plugin.mjs');
        const sandbox = new PluginSandbox(crashingPluginPath);
        
        try {
            await sandbox.run();
            fail('Le plugin aurait dû crasher');
        } catch (error) {
            expect(error.toString()).toContain('Plugin crash simulé');
        }
    });
    
    test('timeout sur un plugin bloquant', async () => {
        const hangingPluginPath = path.join(__dirname, 'fixtures', 'hanging-plugin.mjs');
        const sandbox = new PluginSandbox(hangingPluginPath);
        
        await expect(sandbox.run()).rejects.toBe('Plugin timeout');
    }, 6000);
    
    test('exécute un plugin valide avec succès', async () => {
        const validPluginPath = path.join(__dirname, 'fixtures', 'valid-plugin.mjs');
        const sandbox = new PluginSandbox(validPluginPath);
        
        const result = await sandbox.run();
        expect(result).toBe('success');
    });
}); 