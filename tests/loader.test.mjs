import { PluginLoader } from '../core/loader.mjs';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockFs = {
    readdir: jest.fn(),
    readFile: jest.fn()
};

const mockPlugin = {
    meta: {
        id: 'valid-plugin'
    },
    start: jest.fn()
};

const mockImport = jest.fn().mockResolvedValue(mockPlugin);

jest.unstable_mockModule('fs/promises', () => mockFs);

describe('Loader de plugins', () => {
    let loader;

    beforeEach(() => {
        loader = new PluginLoader(mockFs, mockImport);
        jest.clearAllMocks();
    });

    it('devrait charger les plugins correctement', async () => {
        //Arrange
        mockFs.readdir.mockResolvedValue([{
            name: 'valid-plugin',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockResolvedValue(`id: valid-plugin
version: 1.0.0
permissions: 
  - log_metric`);

        //Act
        const plugins = await loader.loadPlugins('./mods');

        //Assert
        expect(plugins.length).toBe(1);
        expect(plugins[0].config.id).toBe('valid-plugin');
        expect(plugins[0].config.version).toBe('1.0.0');
        expect(plugins[0].code).toBe(mockPlugin);
    });

    it('devrait gérer les erreurs de lecture du dossier', async () => {
        //Arrange
        mockFs.readdir.mockRejectedValue(new Error('Erreur de lecture'));

        //Act
        const plugins = await loader.loadPlugins('./mods');

        //Assert
        expect(plugins).toEqual([]);
    });

    it('devrait ignorer les plugins invalides', async () => {
        //Arrange
        mockFs.readdir.mockResolvedValue([{
            name: 'invalid-plugin',
            isDirectory: () => true
        }]);

        mockFs.readFile.mockRejectedValue(new Error('Fichier manquant'));

        //Act
        const plugins = await loader.loadPlugins('./mods');

        //Assert
        expect(plugins).toEqual([]);
    });
});
