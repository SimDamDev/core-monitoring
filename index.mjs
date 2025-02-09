import { PluginLoader } from './core/loader.mjs';
import { PluginSandbox } from './core/sandbox.mjs';
import { Dashboard } from './core/dashboard.mjs';
import { Storage } from './core/storage.mjs';
import fs from 'fs/promises';

async function main() {
    console.log('🔍 Chargement des plugins...');
    
    // Initialisation du stockage et du dashboard
    const storage = new Storage();
    const dashboard = new Dashboard(3000, storage);
    await dashboard.ready;
    
    const loader = new PluginLoader(fs);
    const plugins = await loader.loadPlugins();

    if (plugins.length === 0) {
        console.log('🤷 Aucun plugin trouvé ! Créez un dossier dans mods/');
        return;
    }

    console.log(`✅ ${plugins.length} plugins chargés :`);
    const sandboxes = [];

    for (const plugin of plugins) {
        console.log(`- ${plugin.config.id} v${plugin.config.version}`);
        const sandbox = new PluginSandbox(plugin.code, plugin.config);
        
        // Gestion des métriques
        sandbox.on('metric', async (data) => {
            try {
                await storage.insertMetric(data);
                await dashboard.broadcastMetric(data);
                console.log('[METRIQUE]', data);
            } catch (error) {
                console.error(`❌ Erreur traitement métrique:`, error);
            }
        });

        try {
            await sandbox.start();
            sandboxes.push(sandbox);
        } catch (error) {
            console.error(`❌ Erreur démarrage ${plugin.config.id}:`, error);
        }
    }

    // Gestion de l'arrêt gracieux
    process.on('SIGINT', async () => {
        console.log('\n🛑 Arrêt des plugins...');
        await Promise.all(sandboxes.map(s => s.stop()));
        await dashboard.cleanup();
        await storage.cleanup();
        process.exit(0);
    });
}

main().catch(console.error);
