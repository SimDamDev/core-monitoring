import fs from 'fs/promises';
import path from 'path';
import * as url from 'url';
import { buildPluginsPaths, validatePluginStructure } from './utils.mjs';

/**
 * Charge les plugins depuis le répertoire des mods
 * @param {string} modsDir - Chemin vers le répertoire des mods (par défaut './mods')
 * @returns {Promise<Array<{config: string, code: Object}>>} Tableau des plugins chargés avec leur configuration et code
 * @throws {Error} Si une erreur survient lors de la lecture du répertoire ou du chargement d'un plugin
 */
export async function loadPlugins(modsDir = './mods') {
    const plugins = [];

    try{
        const dirs = await fs.readdir(modsDir, {withFileTypes: true});

        for (const dir of dirs){
            if (dir.isDirectory()){
                const paths = buildPluginsPaths(modsDir, dir.name);

                try{
                    //Lire le mod.yml (a completer avec la validation)
                    const modConfig = await fs.readFile(paths.config, 'utf-8');
                    const pluginCode = await import(url.pathToFileURL(paths.code).href + '?t=' + Date.now());

                    // Validation de la structure du plugin
                    validatePluginStructure(pluginCode);

                    plugins.push({
                        config: modConfig,
                        code: pluginCode
                    });
                } catch (error){
                    console.error(`⚠️ Plugin ${dir.name} invalide :`, error.message);
                }
            }
        }
    } catch (error){
        console.error(`❌ Erreur lecture ${modsDir}/ :`, error.message);
    }
    return plugins;
}
                    
