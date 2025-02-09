import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.join(__dirname, '..', 'metrics.db');
const BACKUP_PATH = path.join(__dirname, '..', 'backups', `metrics_${Date.now()}.db`);

async function backup() {
    try {
        // Création de la commande de backup
        const command = `sqlite3 "${DB_PATH}" ".backup '${BACKUP_PATH}'"`;
        
        // Exécution de la commande
        await execAsync(command);
        
        console.log(`✅ Backup créé avec succès: ${BACKUP_PATH}`);
        
        // Nettoyage des vieux backups (garde les 7 derniers jours)
        const cleanupCommand = `find "${path.join(__dirname, '..', 'backups')}" -name "metrics_*.db" -mtime +7 -delete`;
        await execAsync(cleanupCommand);
        
        console.log('🧹 Nettoyage des anciens backups effectué');
    } catch (error) {
        console.error('❌ Erreur lors du backup:', error);
        process.exit(1);
    }
}

// Exécution du backup
backup(); 