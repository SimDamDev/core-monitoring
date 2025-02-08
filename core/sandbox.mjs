import {Worker} from "worker_threads";

export class PluginSandbox {
    constructor(pluginPath) {
        this.worker = new Worker(pluginPath, {
                workerData: {},
                execArgv: ["--experimental-vm-modules"]
            });
    }

    //execute le plugin avec timeout
    async run() {
        return new Promise((resolve,reject) =>{
            const timeout = setTimeout(() => {
                this.worker.terminate();
                reject('Plugin timeout');
        }, 5000);

        this.worker.on('message', resolve);
        this.worker.on('error', reject);
        this.worker.on('exit', (code) => {
            clearTimeout(timeout);
                if (code !== 0) reject('Plugin crashed: ${code}');
            });
        });
    }
}

