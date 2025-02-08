import path from 'path';

export function validatePluginStructure(pluginCode) {
    // Vérifier la présence de meta et start dans le code source
    if (!pluginCode.includes('exports.meta') || !pluginCode.includes('exports.start')) {
        throw new Error('⚠️ Structure invalide : le plugin doit exporter "meta" et une fonction "start"');
    }
}

export function buildPluginsPaths(baseDir, pluginName) {
    return {
        code: `${baseDir}/${pluginName}/index.mjs`,
        config: `${baseDir}/${pluginName}/mod.yml`
    };
}
