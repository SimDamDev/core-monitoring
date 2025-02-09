import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Storage {
    constructor(dbPath = 'metrics.db') {
        this.dbPath = path.join(__dirname, '..', dbPath);
        this.db = new sqlite3.Database(this.dbPath);
        this.ready = this.initDatabase();
    }

    async initDatabase() {
        const run = promisify(this.db.run.bind(this.db));
        
        try {
            // Active le mode WAL pour de meilleures performances
            await run('PRAGMA journal_mode = WAL');
            
            // Création de la table metrics
            await run(`
                CREATE TABLE IF NOT EXISTS metrics (
                    timestamp INTEGER NOT NULL,
                    source TEXT CHECK(length(source) <= 32),
                    name TEXT,
                    value REAL NOT NULL,
                    unit TEXT CHECK(unit IN ('%', 'ms', 'MB')),
                    PRIMARY KEY (timestamp, source)
                )
            `);

            await run(`
                CREATE INDEX IF NOT EXISTS idx_metrics_source 
                ON metrics(source)
            `);

            await run(`
                CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
                ON metrics(timestamp DESC)
            `);
        } catch (error) {
            console.error('Erreur initialisation base de données:', error);
            throw error;
        }
    }

    async insertMetric(metric) {
        await this.ready;
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO metrics (timestamp, source, name, value, unit)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    metric.timestamp,
                    metric.source,
                    metric.name,
                    metric.value,
                    metric.unit
                ],
                (err) => {
                    if (err) {
                        console.error('Erreur insertion métrique:', err);
                        reject(err);
                    } else {
                        resolve(true);
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
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    async cleanup() {
        await this.ready;
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close(() => resolve());
            } else {
                resolve();
            }
        });
    }

    async backup() {
        await this.ready;
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = this.dbPath.replace('.db', `_backup_${timestamp}.db`);
            this.db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
                if (err) {
                    console.error('Erreur backup:', err);
                    reject(err);
                } else {
                    console.log(`✅ Backup créé: ${backupPath}`);
                    resolve();
                }
            });
        });
    }
} 