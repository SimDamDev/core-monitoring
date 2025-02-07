import { loadPlugins } from '../core/loader.mjs';
import { describe, it, expect, jest } from '@jest/globals';
import fs from 'fs/promises';

//Mock le filesystem
jest.mock('fs/promises', () => ({
    readdir: jest.fn(),
    readFile: jest.fn(),
}));

describe('Loader de plugins', () => {
    it('devrait charger les plugins correctement', async () => {
        //Arrange
        fs.readdir.mockResolvedValue([{
            name: 'valid-plugin',
            isDirectory: () => true
        }]);

        fs.readFile.mockResolvedValue(`
            id: valid-plugin
            permissions: [log]
        `);

        //Act
        const plugins = await loadPlugins('./mods');

        //Assert
        expect(plugins.length).toBe(1);
        expect(plugins[0].config.id).toBe('valid-plugin');
    });
});
