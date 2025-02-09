import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Storage {
    constructor(dbPath = 'metrics.db') {
        this.dbPath = path.join(__dirname, '..', dbPath);
        this.db = new Database(this.dbPath);
        this.ready = this.initDatabase();
    }

    async initDatabase() {
        try {
            // Active le mode WAL pour de meilleures performances
            this.db.pragma('journal_mode = WAL');
            
            // Création de la table metrics
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS metrics (
                    timestamp INTEGER NOT NULL,
                    source TEXT CHECK(length(source) <= 32),
                    name TEXT,
                    value REAL NOT NULL,
                    unit TEXT CHECK(unit IN ('%', 'ms', 'MB')),
                    PRIMARY KEY (timestamp, source)
                )
            `);

            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_metrics_source 
                ON metrics(source)
            `);

            this.db.exec(`
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
        const stmt = this.db.prepare(
            `INSERT INTO metrics (timestamp, source, name, value, unit)
            VALUES (?, ?, ?, ?, ?)`
        );
        try {
            stmt.run(
                metric.timestamp,
                metric.source,
                metric.name,
                metric.value,
                metric.unit
            );
            return true;
        } catch (error) {
            console.error('Erreur insertion métrique:', error);
            throw error;
        }
    }

    async getLast24h() {
        await this.ready;
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const stmt = this.db.prepare(
            `SELECT * FROM metrics 
            WHERE timestamp > ? 
            ORDER BY timestamp DESC
            LIMIT 1000`
        );
        try {
            return stmt.all(oneDayAgo);
        } catch (error) {
            console.error('Erreur récupération métriques:', error);
            throw error;
        }
    }

    async cleanup() {
        await this.ready;
        if (this.db) {
            this.db.close();
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