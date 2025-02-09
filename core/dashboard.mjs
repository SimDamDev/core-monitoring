import { WebSocketServer } from 'ws';
import http from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Dashboard {
    constructor(port, storage) {
        if (!storage) throw new Error('Storage est requis');
        this.storage = storage;
        this.metrics = [];
        this.clients = new Set();
        this.ready = this.init(port);
    }

    async init(port) {
        try {
            // Attendre que le stockage soit prêt
            await this.storage.ready;

            // Chargement du fichier HTML
            const htmlPath = path.join(__dirname, 'dashboard.html');
            this.dashboardHtml = await readFile(htmlPath, 'utf8');

            // Création du serveur HTTP
            this.server = http.createServer(async (req, res) => {
                // Autoriser les requêtes locales
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cache-Control', 'no-cache');
                
                if (req.url === '/metrics') {
                    res.setHeader('Content-Type', 'application/json');
                    // Retourner les métriques en mémoire
                    const metrics = await this.getLatestMetrics();
                    res.end(JSON.stringify(metrics));
                    return;
                }
                
                // Servir le dashboard
                res.setHeader('Content-Type', 'text/html');
                res.end(this.dashboardHtml);
            });

            // Création du serveur WebSocket
            this.wss = new WebSocketServer({ server: this.server });
            
            // Gestion des connexions WebSocket
            this.wss.on('connection', (ws) => {
                console.log('📱 Nouvelle connexion WebSocket');
                this.clients.add(ws);
                ws.on('close', () => {
                    console.log('📴 Déconnexion WebSocket');
                    this.clients.delete(ws);
                });
            });

            // Démarrage du serveur
            await new Promise((resolve, reject) => {
                this.server.on('error', (error) => {
                    console.error('❌ Erreur serveur HTTP:', error);
                    reject(error);
                });

                this.server.listen(port, () => {
                    console.log(`📊 Dashboard prêt sur http://localhost:${port}`);
                    resolve();
                });
            });

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
        for (const client of this.clients) {
            client.close();
        }
        this.clients.clear();
        if (this.server) {
            this.server.close();
        }
    }
} 