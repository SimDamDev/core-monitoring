import EventEmitter from 'events';
import { REFRESH_PROFILES } from './config.mjs';

export class MetricsScheduler extends EventEmitter {
    constructor() {
        super();
        this.activeConnections = 0;
        this.isCollecting = false;
        this.plugins = new Set();
        this.collectionIntervals = new Map();
        console.log('🔄 Scheduler initialisé');
    }

    addPlugin(plugin) {
        console.log(`➕ Plugin ajouté au scheduler: ${plugin.config.id}`);
        this.plugins.add(plugin);
        if (this.isCollecting) {
            console.log(`▶️ Démarrage immédiat de la collecte pour ${plugin.config.id}`);
            this.startPluginCollection(plugin);
        }
    }

    removePlugin(plugin) {
        console.log(`➖ Plugin retiré du scheduler: ${plugin.config.id}`);
        this.plugins.delete(plugin);
        this.stopPluginCollection(plugin);
    }

    startPluginCollection(plugin) {
        if (!plugin.config?.refresh_profile) {
            console.log(`⚠️ Pas de profil de rafraîchissement pour ${plugin.config.id}`);
            return;
        }
        
        const interval = REFRESH_PROFILES[plugin.config.refresh_profile];
        if (interval <= 0) {
            console.log(`⚠️ Intervalle invalide pour ${plugin.config.id}: ${interval}`);
            return;
        }

        console.log(`⏰ Configuration timer pour ${plugin.config.id} (${interval}ms)`);
        const timer = setInterval(() => {
            if (this.isCollecting) {
                console.log(`📊 Collecte pour ${plugin.config.id}`);
                plugin.collect();
            }
        }, interval);

        timer.unref();
        this.collectionIntervals.set(plugin, timer);
    }

    stopPluginCollection(plugin) {
        const timer = this.collectionIntervals.get(plugin);
        if (timer) {
            console.log(`⏹️ Arrêt collecte pour ${plugin.config.id}`);
            clearInterval(timer);
            this.collectionIntervals.delete(plugin);
        }
    }

    incrementConnections() {
        this.activeConnections++;
        console.log(`📈 Dashboard connecté (actifs: ${this.activeConnections}) → Démarrage collecte`);
        this.updateCollectionState();
    }

    decrementConnections() {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
        console.log(`📉 Dashboard déconnecté (actifs: ${this.activeConnections}) → ${this.activeConnections === 0 ? 'Mode veille' : 'Collecte active'}`);
        this.updateCollectionState();
    }

    updateCollectionState() {
        const shouldCollect = this.activeConnections > 0;
        console.log(`🔄 Mise à jour état collecte: ${shouldCollect ? 'actif' : 'inactif'} (${this.activeConnections} connexions)`);
        console.log(`📊 Plugins enregistrés: ${Array.from(this.plugins).map(p => p.config.id).join(', ')}`);
        
        if (shouldCollect === this.isCollecting) {
            console.log('⏭️ Pas de changement d\'état nécessaire');
            return;
        }
        
        this.isCollecting = shouldCollect;
        
        if (shouldCollect) {
            console.log('▶️ Démarrage collecte pour tous les plugins');
            for (const plugin of this.plugins) {
                console.log(`📌 Configuration collecte pour ${plugin.config.id}`);
                this.startPluginCollection(plugin);
                console.log(`📊 Première collecte pour ${plugin.config.id}`);
                plugin.collect();
            }
            this.emit('collection:start');
        } else {
            console.log('⏹️ Arrêt collecte pour tous les plugins');
            for (const plugin of this.plugins) {
                this.stopPluginCollection(plugin);
            }
            this.emit('collection:stop');
        }
    }

    cleanup() {
        console.log('🧹 Nettoyage du scheduler');
        for (const [plugin, timer] of this.collectionIntervals) {
            clearInterval(timer);
        }
        this.collectionIntervals.clear();
        this.plugins.clear();
        this.activeConnections = 0;
        this.isCollecting = false;
    }
} 