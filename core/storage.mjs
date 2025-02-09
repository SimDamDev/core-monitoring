import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Storage {
    constructor() {
        const dbPath = path.join(__dirname, '..', 'metrics.db');
        this.db = new sqlite3.Database(dbPath);
        this.ready = new Promise((resolve, reject) => {
            this.initDatabase().then(resolve).catch(reject);
        });
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            try {
                // Active le mode WAL pour de meilleures performances
                this.db.run('PRAGMA journal_mode = WAL');
                
                // Création de la table metrics
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS metrics (
                        timestamp INTEGER NOT NULL,
                        source TEXT CHECK(length(source) <= 32),
                        name TEXT,
                        value REAL NOT NULL,
                        unit TEXT CHECK(unit IN ('%', 'ms', 'MB')),
                        PRIMARY KEY (timestamp, source)
                    )
                `);

                this.db.run(`
                    CREATE INDEX IF NOT EXISTS idx_metrics_source 
                    ON metrics(source)
                `);

                this.db.run(`
                    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
                    ON metrics(timestamp DESC)
                `, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });

            } catch (error) {
                console.error('Erreur initialisation base de données:', error);
                reject(error);
            }
        });
    }

    async insertMetric(data) {
        await this.ready;
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO metrics (timestamp, source, name, value, unit)
                VALUES (?, ?, ?, ?, ?)`,
                [data.timestamp, data.source, data.name, data.value, data.unit],
                (err) => {
                    if (err) {
                        console.error('Erreur insertion métrique:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async getLast24h() {
        await this.ready;
        return new Promise((resolve, reject) => {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            this.db.all(
                `SELECT * FROM metrics 
                WHERE timestamp > ? 
                ORDER BY timestamp DESC
                LIMIT 1000`,
                [oneDayAgo],
                (err, rows) => {
                    if (err) {
                        console.error('Erreur récupération métriques:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    async cleanOldMetrics() {
        await this.ready;
        return new Promise((resolve, reject) => {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            this.db.run(
                `DELETE FROM metrics 
                WHERE timestamp < ?`,
                [oneDayAgo],
                function(err) {
                    if (err) {
                        console.error('Erreur nettoyage métriques:', err);
                        reject(err);
                    } else {
                        console.log(`🧹 Nettoyage de ${this.changes} anciennes métriques`);
                        resolve(this.changes);
                    }
                }
            );
        });
    }

    async cleanup() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close(() => {
                    resolve();
                });
            });
        }
    }

    async backup() {
        await this.ready;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = this.dbPath.replace('.db', `_backup_${timestamp}.db`);
        try {
            this.db.backup(backupPath);
            console.log(`✅ Backup créé: ${backupPath}`);
        } catch (error) {
            console.error('Erreur backup:', error);
            throw error;
        }
    }
} 