import { Worker } from 'worker_threads';
import EventEmitter from 'events';
import { fileURLToPath } from 'url';
import path from 'path';

export class PluginSandbox extends EventEmitter {
    constructor(pluginCode, config) {
        super();
        this.pluginCode = pluginCode;
        this.config = config;
        this.worker = null;
        this.timeoutId = null;
    }

    async start() {
        return new Promise((resolve, reject) => {
            try {
                // Création du worker avec le fichier worker.mjs
                const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "worker.mjs");
                this.worker = new Worker(workerPath);

                // Gestion des messages du worker
                this.worker.on('message', (message) => {
                    switch (message.type) {
                        case 'log':
                            console.log(`[Plugin ${this.config.id}]`, ...message.data);
                            break;
                        case 'error':
                            console.error(`[Plugin ${this.config.id}]`, ...message.data);
                            break;
                        case 'metric':
                            this.emit('metric', {
                                ...message.data,
                                source: this.config.id
                            });
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
                    permissions: this.config.permissions
                });

            } catch (error) {
                console.error(`[Plugin ${this.config.id}] Erreur de demarrage:`, error.message);
                this.cleanup();
                reject(error);
            }
        });
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
        this.cleanup();
    }
}

