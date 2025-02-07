import path from 'path';

export const buildPluginsPaths = (baseDir, pluginName) => ({
    config: path.join(baseDir, pluginName, 'mod.yml'),
    code: path.join(baseDir, pluginName, 'index.mjs'),
});



export const validatePluginStructure = (plugin) => {
    if (!plugin.meta || !plugin.start || typeof plugin.start !== 'function') {
        throw new Error(`⚠️ Structure invalide : le plugin doit exporter 'meta' et une fonction 'start'`);
    }
};
