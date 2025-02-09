import { Worker } from 'worker_threads';
import EventEmitter from 'events';
import { fileURLToPath } from 'url';
import path from 'path';
import { WORKER_RESOURCE_LIMITS } from './bootstrap.mjs';
import { DEFAULT_CONFIG } from './config.mjs';

export class PluginSandbox extends EventEmitter {
    constructor(pluginCode, config = {}) {
        super();
        this.pluginCode = pluginCode;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        this.worker = null;
        this.timeoutId = null;
    }

    async start() {
        return new Promise((resolve, reject) => {
            try {
                // Création du worker avec le fichier worker.mjs et limites de ressources
                const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "worker.mjs");
                this.worker = new Worker(workerPath, {
                    resourceLimits: WORKER_RESOURCE_LIMITS
                });

                // Gestion des messages du worker
                this.worker.on('message', (message) => {
                    switch (message.type) {
                        case 'log':
                            console.log(`[Plugin ${this.config.id}]`, ...message.data);
                            break;
                        case 'error':
                            console.error(`[Plugin ${this.config.id}]`, ...message.data);
                            break;
                        case 'warn':
                            console.warn(`[Plugin ${this.config.id}]`, ...message.data);
                            break;
                        case 'metric':
                            try {
                                this.emit('metric', {
                                    ...message.data,
                                    source: this.config.id
                                });
                            } catch (error) {
                                console.warn(`[Plugin ${this.config.id}] Métrique invalide:`, error.message);
                            }
                            break;
                        case 'started':
                            if (this.timeoutId) {
                                clearTimeout(this.timeoutId);
                                this.timeoutId = null;
                            }
                            resolve(true);
                            break;
                    }
                });

                // Gestion des erreurs
                this.worker.on('error', (error) => {
                    console.error(`[Plugin ${this.config.id}] Erreur:`, error.message);
                    this.cleanup();
                    reject(error);
                });

                // Gestion de la fin du worker
                this.worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`[Plugin ${this.config.id}] Worker termine avec le code:`, code);
                    }
                    this.cleanup();
                    if (code !== 0) {
                        reject(new Error(`Worker termine avec le code: ${code}`));
                    }
                });

                // Timeout de 5 secondes
                this.timeoutId = setTimeout(() => {
                    console.error(`[Plugin ${this.config.id}] Timeout du plugin`);
                    this.cleanup();
                    reject(new Error('Timeout du plugin'));
                }, 5000);

                // Envoi du code et des permissions au worker
                this.worker.postMessage({
                    code: this.pluginCode,
                    permissions: this.config.permissions || []
                });

            } catch (error) {
                console.error(`[Plugin ${this.config.id}] Erreur de demarrage:`, error.message);
                this.cleanup();
                reject(error);
            }
        });
    }

    collect() {
        if (this.worker) {
            console.log(`[Plugin ${this.config.id}] 📊 Collecte demandée`);
            this.worker.postMessage({ type: 'collect' });
        } else {
            console.log(`[Plugin ${this.config.id}] ⚠️ Collecte impossible: worker non démarré`);
        }
    }

    cleanup() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }

    async stop() {
        return new Promise((resolve) => {
            if (!this.worker) {
                resolve(true);
                return;
            }
            
            const cleanup = () => {
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                }
                if (this.worker) {
                    this.worker.terminate();
                    this.worker = null;
                }
                resolve(true);
            };
            
            this.worker.once('exit', cleanup);
            this.worker.postMessage({ type: 'stop' });
            
            // Timeout de sécurité
            const timeoutId = setTimeout(() => {
                if (this.worker) {
                    this.worker.removeListener('exit', cleanup);
                    cleanup();
                }
            }, 1000);
            timeoutId.unref(); // Pour éviter de bloquer le processus
        });
    }
}

