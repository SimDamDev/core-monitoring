import { PluginLoader } from '../core/loader.mjs';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock des modules
const mockFs = {
    readdir: jest.fn(),
    readFile: jest.fn()
};

// Mock de path.resolve
const mockResolve = jest.fn((...args) => args.join('/'));

// Mock de url.pathToFileURL
const mockPathToFileURL = jest.fn((p) => ({ href: `file://${p}` }));

jest.mock('fs/promises', () => mockFs);
jest.mock('path', () => ({ resolve: mockResolve }));
jest.mock('url', () => ({ pathToFileURL: mockPathToFileURL }));

describe('Loader de plugins', () => {
    let loader;
    let originalImport;

    beforeEach(() => {
        // Sauvegarde de l'import original
        originalImport = global.import;
        
        // Reset des mocks
        jest.clearAllMocks();
        
        // Création du loader avec le fs mocké
        loader = new PluginLoader(mockFs);
    });

    afterEach(() => {
        // Restauration de l'import original
        global.import = originalImport;
    });

    it('devrait charger les plugins correctement', async () => {
        // Arrange
        const mockPlugin = {
            meta: { id: 'valid-plugin' },
            start: jest.fn()
        };

        mockFs.readdir.mockResolvedValue([{
            name: 'valid-plugin',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockResolvedValue(`
id: valid-plugin
version: 1.0.0
permissions: 
  - metrics:write`);

        // Mock de import() dynamique
        const mockImport = jest.fn().mockResolvedValue(mockPlugin);
        loader.importFn = mockImport;

        // Act
        const plugins = await loader.loadPlugins('./mods');

        // Assert
        expect(plugins.length).toBe(1);
        expect(plugins[0].config.id).toBe('valid-plugin');
        expect(plugins[0].config.version).toBe('1.0.0');
        expect(plugins[0].code).toBe(mockPlugin);
    });

    it('devrait gérer les erreurs de lecture du dossier', async () => {
        // Arrange
        mockFs.readdir.mockRejectedValue(new Error('Erreur de lecture'));

        // Act
        const plugins = await loader.loadPlugins('./mods');

        // Assert
        expect(plugins).toEqual([]);
    });

    it('devrait ignorer les plugins invalides', async () => {
        // Arrange
        mockFs.readdir.mockResolvedValue([{
            name: 'invalid-plugin',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockRejectedValue(new Error('Fichier manquant'));

        // Act
        const plugins = await loader.loadPlugins('./mods');

        // Assert
        expect(plugins).toEqual([]);
    });

    it('devrait valider la structure du plugin', async () => {
        // Arrange
        const invalidPlugin = {
            // Pas de meta ni de start
            someOtherFunction: () => {}
        };

        mockFs.readdir.mockResolvedValue([{
            name: 'invalid-structure',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockResolvedValue(`
id: invalid-structure
version: 1.0.0
permissions: 
  - metrics:write`);

        // Mock de import() dynamique
        const mockImport = jest.fn().mockResolvedValue(invalidPlugin);
        loader.importFn = mockImport;

        // Act
        const plugins = await loader.loadPlugins('./mods');

        // Assert
        expect(plugins).toEqual([]);
    });

    it('devrait valider les permissions du plugin', async () => {
        // Arrange
        const validPlugin = {
            meta: { id: 'valid-plugin' },
            start: jest.fn()
        };

        mockFs.readdir.mockResolvedValue([{
            name: 'valid-plugin',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockResolvedValue(`
id: valid-plugin
version: 1.0.0
permissions: 
  - invalid:permission`); // Permission invalide

        // Mock de import() dynamique
        const mockImport = jest.fn().mockResolvedValue(validPlugin);
        loader.importFn = mockImport;

        // Act
        const plugins = await loader.loadPlugins('./mods');

        // Assert
        expect(plugins).toEqual([]);
    });
});
