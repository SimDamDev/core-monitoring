import { WebSocketServer } from 'ws';
import Fastify from 'fastify';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Dashboard {
    constructor(port, storage, scheduler) {
        if (!storage) throw new Error('Storage est requis');
        if (!scheduler) throw new Error('Scheduler est requis');
        
        this.storage = storage;
        this.scheduler = scheduler;
        this.metrics = [];
        this.clients = new Set();
        
        // Création du serveur Fastify dès le constructeur
        this.server = Fastify();
        this.server.decorate('storage', this.storage);
        
        this.ready = new Promise((resolve, reject) => {
            this.init(port).then(resolve).catch(reject);
        });
    }

    async init(port) {
        try {
            // Attendre que le stockage soit prêt
            await this.storage.ready;

            // Chargement du fichier HTML
            const htmlPath = path.join(__dirname, 'dashboard.html');
            this.dashboardHtml = await readFile(htmlPath, 'utf8');

            // Route pour le dashboard
            this.server.get('/', async (request, reply) => {
                reply.type('text/html');
                return this.dashboardHtml;
            });

            // Route pour les métriques
            this.server.get('/metrics', async (request, reply) => {
                reply.type('application/json');
                return await this.getLatestMetrics();
            });

            // Création du serveur WebSocket
            this.wss = new WebSocketServer({ server: this.server.server });
            
            // Gestion des connexions WebSocket
            this.wss.on('connection', (ws) => {
                console.log('📱 Nouvelle connexion WebSocket');
                this.clients.add(ws);
                this.scheduler.incrementConnections();

                ws.on('close', () => {
                    console.log('📴 Déconnexion WebSocket');
                    this.clients.delete(ws);
                    this.scheduler.decrementConnections();
                });
            });

            // Démarrage du serveur
            await this.server.listen({ port });
            console.log(`📊 Dashboard prêt sur http://localhost:${port}`);

            // Écoute des événements du scheduler
            this.scheduler.on('collection:stop', async () => {
                // Nettoyage des anciennes métriques quand la collecte s'arrête
                await this.storage.cleanOldMetrics();
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation dashboard:', error);
            throw error;
        }
    }

    async getLatestMetrics() {
        try {
            // Récupérer les métriques de la base de données
            const dbMetrics = await this.storage.getLast24h();
            
            // Utiliser un Map pour dédupliquer les métriques
            const metricsMap = new Map();
            
            // Ajouter d'abord les métriques de la DB
            for (const metric of dbMetrics) {
                const key = `${metric.timestamp}_${metric.source}`;
                metricsMap.set(key, metric);
            }
            
            // Ajouter les métriques en mémoire (écrasera les doublons)
            for (const metric of this.metrics) {
                const key = `${metric.timestamp}_${metric.source}`;
                metricsMap.set(key, metric);
            }
            
            // Convertir en tableau, trier et limiter
            const allMetrics = Array.from(metricsMap.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 50);
                
            return allMetrics;
        } catch (error) {
            console.error('❌ Erreur récupération métriques:', error);
            return this.metrics;
        }
    }

    async broadcastMetric(metric) {
        try {
            // Stocker la métrique en mémoire
            this.metrics.push(metric);
            // Garder seulement les 50 dernières métriques
            if (this.metrics.length > 50) {
                this.metrics = this.metrics.slice(-50);
            }

            // Envoyer aux clients WebSocket
            const message = JSON.stringify(metric);
            for (const client of this.clients) {
                if (client.readyState === 1) { // OPEN
                    client.send(message);
                }
            }
        } catch (error) {
            console.error('❌ Erreur broadcast métrique:', error);
        }
    }

    async cleanup() {
        console.log('🧹 Nettoyage du dashboard');
        if (this.wss) {
            for (const client of this.clients) {
                client.close();
            }
            this.wss.close();
        }
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    console.log('📊 Serveur dashboard arrêté');
                    resolve();
                });
            });
        }
        this.clients.clear();
        this.metrics = [];
    }
} 