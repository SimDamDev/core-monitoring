import { PluginLoader } from './core/loader.mjs';
import { PluginSandbox } from './core/sandbox.mjs';
import { Dashboard } from './core/dashboard.mjs';
import { Storage } from './core/storage.mjs';
import { MetricsScheduler } from './core/scheduler.mjs';
import { exportRoutes } from './routes/export.mjs';
import fs from 'fs/promises';

// Gestion des erreurs non capturées
process.on('uncaughtException', async (error) => {
    console.error('🔥 FATAL: ERREUR NON CAPTUREE - Redemarrage gracieux');
    console.error('Stack:', error);
    console.error('Message:', error.message);
    process.exit(1);
});

async function main() {
    console.log('🔍 Chargement des plugins...');
    
    // Initialisation des composants
    const storage = new Storage();
    const scheduler = new MetricsScheduler();
    const dashboard = new Dashboard(3000, storage, scheduler);

    try {
        // Attendre que le stockage soit prêt et nettoyer les anciennes métriques
        await storage.ready;
        await storage.cleanOldMetrics();
        
        // Attendre que le dashboard soit prêt
        const server = dashboard.server;
        
        // Enregistrement des routes d'export avant le démarrage du serveur
        await exportRoutes(server);
        
        // Maintenant on attend que le dashboard soit complètement initialisé
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
                scheduler.addPlugin(sandbox);
                sandboxes.push(sandbox);
            } catch (error) {
                console.error(`❌ Erreur démarrage ${plugin.config.id}:`, error);
            }
        }

        // Gestion de l'arrêt gracieux
        let isShuttingDown = false;
        async function shutdown() {
            if (isShuttingDown) return;
            isShuttingDown = true;
            
            console.log('\n🛑 Arrêt des plugins...');
            await Promise.all(sandboxes.map(s => s.stop()));
            scheduler.cleanup();
            await dashboard.cleanup();
            await storage.cleanup();
            process.exit(0);
        }

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
}

main();
