import { parentPort } from "worker_threads";

// Capture des erreurs non gérées
process.on("uncaughtException", (error) => {
    parentPort.postMessage({ 
        type: "error", 
        data: ["Erreur non geree", error.message] 
    });
});

// APIs sécurisées
const console = {
    log: (...args) => parentPort.postMessage({ type: "log", data: args }),
    error: (...args) => parentPort.postMessage({ type: "error", data: args })
};

// Contexte global sécurisé
const secureGlobal = {
    console,
    exports: {},
    setTimeout,
    clearTimeout,
    process: {
        uptime: process.uptime.bind(process),
        memoryUsage: process.memoryUsage.bind(process),
        cpuUsage: process.cpuUsage.bind(process)
    }
};

// Remplacer le contexte global
Object.keys(secureGlobal).forEach(key => {
    global[key] = secureGlobal[key];
});

// Recevoir le code du plugin et les permissions
parentPort.on("message", ({ code, permissions }) => {
    try {
        // API de métriques
        if (permissions.includes("metrics:write")) {
            global.sendMetric = (data) => parentPort.postMessage({ type: "metric", data });
        }

        // APIs système si autorisées
        if (permissions.includes("system:info")) {
            global.system = {
                uptime: () => process.uptime(),
                memory: () => process.memoryUsage(),
                cpuUsage: () => process.cpuUsage()
            };
        }

        // Exécution du code du plugin
        eval(code);

        // Vérification de la structure
        if (!exports.meta || !exports.start) {
            throw new Error("Structure de plugin invalide");
        }

        // Démarrage du plugin
        const context = {
            sendMetric: global.sendMetric
        };

        Promise.resolve(exports.start(context))
            .then(() => {
                parentPort.postMessage({ type: "started" });
            })
            .catch((error) => {
                parentPort.postMessage({ 
                    type: "error", 
                    data: ["Erreur de demarrage", error.message] 
                });
            });
    } catch (error) {
        parentPort.postMessage({ 
            type: "error", 
            data: ["Erreur initialisation", error.message] 
        });
    }
}); 