import fs from 'fs/promises';
import path from 'path';
import * as url from 'url';
import { buildPluginsPaths, validatePluginStructure } from './utils.mjs';
import { PluginValidator } from './security.mjs';
import { MetricsPipeline } from './metrics.mjs';

export class PluginLoader {
    constructor(fsModule = fs, importFn = (path) => import(url.pathToFileURL(path).href)) {
        this.fs = fsModule;
        this.importFn = importFn;
        this.metricsPipeline = new MetricsPipeline();
    }

    async scanDirectories(baseDir) {
        try {
            return await this.fs.readdir(baseDir, { withFileTypes: true });
        } catch (error) {
            console.error(`❌ Erreur lecture ${baseDir}/ :`, error.message);
            return [];
        }
    }

    async loadPlugin(dir, baseDir) {
        if (!dir.isDirectory()) return null;

        const paths = buildPluginsPaths(baseDir, dir.name);

        try {
            const modConfigRaw = await this.fs.readFile(paths.config, 'utf-8');
            const config = await PluginValidator.validate(paths.config, modConfigRaw);
            
            // Charger le module
            const pluginPath = path.resolve(process.cwd(), paths.code);
            const pluginCode = await this.importFn(pluginPath);

            validatePluginStructure(pluginCode);

            return {
                config,
                code: pluginCode
            };
        } catch (error) {
            console.error(`⚠️ Plugin ${dir.name} invalide :`, error.message);
            return null;
        }
    }

    async loadPlugins(modsDir = './mods') {
        const dirs = await this.scanDirectories(modsDir);
        const plugins = [];

        for (const dir of dirs) {
            const plugin = await this.loadPlugin(dir, modsDir);
            if (plugin) plugins.push(plugin);
        }

        return plugins;
    }
}
                    
