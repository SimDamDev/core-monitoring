import { parentPort } from "worker_threads";

// Capture des erreurs non gérées
process.on("uncaughtException", (error) => {
    parentPort.postMessage({ 
        type: "error", 
        data: ["Erreur non geree", error.message] 
    });
    throw error;
});

// APIs sécurisées
const console = {
    log: (...args) => parentPort.postMessage({ type: "log", data: args }),
    error: (...args) => parentPort.postMessage({ type: "error", data: args })
};

// Contexte global sécurisé
const exports = {};
const module = { exports };
const secureGlobal = {
    console,
    setTimeout,
    clearTimeout,
    exports,
    module,
    process: {
        uptime: process.uptime.bind(process),
        memoryUsage: process.memoryUsage.bind(process),
        cpuUsage: process.cpuUsage.bind(process)
    }
};

// Bloquer setInterval et clearInterval
global.setInterval = function() {
    throw new Error('setInterval est bloqué - utilisez le profil de refresh dans mod.yml');
};

global.clearInterval = function() {
    throw new Error('clearInterval est bloqué - utilisez le profil de refresh dans mod.yml');
};

// Remplacer le contexte global
Object.keys(secureGlobal).forEach(key => {
    global[key] = secureGlobal[key];
});

// Bloquer l'accès aux modules sensibles
const blockedModules = ['fs', 'child_process', 'http', 'https', 'net', 'dgram', 'os', 'cluster'];

// Bloquer require et import
global.require = function(moduleName) {
    throw new Error(`Module ${moduleName} non autorisé - require est bloqué`);
};

global.import = function(moduleName) {
    throw new Error(`Module ${moduleName} non autorisé - import est bloqué`);
};

// Recevoir le code du plugin et les permissions
parentPort.on("message", async ({ code, permissions = [], type }) => {
    // Si c'est un message d'arrêt, on termine le worker
    if (type === 'stop') {
        parentPort.close();
        return;
    }

    // Si c'est un message de collecte, on appelle la fonction collect
    if (type === 'collect' && exports && typeof exports.collect === 'function') {
        try {
            await exports.collect();
        } catch (error) {
            parentPort.postMessage({ 
                type: "error", 
                data: ["Erreur collecte", error.message] 
            });
        }
        return;
    }

    try {
        // Préparer l'API sécurisée
        const api = {};

        // API de métriques si autorisée
        if (permissions.includes("metrics:write")) {
            api.sendMetric = (data) => {
                try {
                    // Validation de la métrique
                    if (typeof data !== 'object' || data === null) {
                        throw new Error("Format de métrique invalide");
                    }
                    if (typeof data.value !== 'number') {
                        throw new Error("La valeur de la métrique doit être un nombre");
                    }
                    if (!data.timestamp || typeof data.timestamp !== 'number') {
                        throw new Error("Le timestamp de la métrique est invalide");
                    }
                    if (!data.unit || typeof data.unit !== 'string') {
                        throw new Error("L'unité de la métrique est invalide");
                    }
                    
                    parentPort.postMessage({ type: "metric", data });
                } catch (error) {
                    parentPort.postMessage({ 
                        type: "error", 
                        data: ["Erreur validation métrique", error.message] 
                    });
                    throw error;
                }
            };
        }

        // APIs système si autorisées
        if (permissions.includes("system:info")) {
            api.system = {
                uptime: () => process.uptime(),
                memory: () => process.memoryUsage(),
                cpuUsage: () => process.cpuUsage()
            };
        }

        // Conversion du code ES modules en CommonJS
        const commonJSCode = code
            .replace(/import\s+.*?from\s+['"].*?['"]\s*;?\n?/g, '') // Supprime les imports
            .replace(/export\s+const\s+(\w+)\s*=\s*/g, 'exports.$1 = ') // Convertit export const en exports.
            .replace(/export\s+function\s+(\w+)\s*\(/g, 'exports.$1 = function('); // Convertit export function en exports.

        // Exécution du code dans un contexte isolé
        const context = {
            exports,
            module,
            api,
            console: {
                log: (...args) => parentPort.postMessage({ type: "log", data: args }),
                error: (...args) => parentPort.postMessage({ type: "error", data: args }),
                warn: (...args) => parentPort.postMessage({ type: "warn", data: args })
            }
        };

        // Exécution du code
        const wrappedCode = `
            (function(exports, module, api, console) {
                ${commonJSCode}
            })(exports, module, api, console);
        `;
        const fn = new Function('exports', 'module', 'api', 'console', wrappedCode);
        fn.call(context, exports, module, api, context.console);

        // Vérification de la structure
        if (!exports.meta || typeof exports.start !== 'function') {
            throw new Error('Structure invalide : le plugin doit exporter "meta" et une fonction "start"');
        }

        // Démarrage du plugin
        await exports.start(api);
        
        // Notification de démarrage réussi
        parentPort.postMessage({ type: "started" });
    } catch (error) {
        parentPort.postMessage({ 
            type: "error", 
            data: ["Erreur initialisation", error.message] 
        });
        throw error;
    }
}); 