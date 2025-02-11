import Ajv from 'ajv';
import { MetricSchema, addCustomFormats } from './schema.mjs';
import { AlertChecker } from './alerts.mjs';

export class MetricsPipeline {
    constructor() {
        this.queue = [];
        this.interval = setInterval(() => this.processQueue(), 1000); //Batch processing
        
        // Initialisation du validateur
        this.ajv = new Ajv({ allErrors: true });
        addCustomFormats(this.ajv);
        this.validateMetric = this.ajv.compile(MetricSchema);

        // Initialisation de l'AlertChecker
        this.alertChecker = new AlertChecker();
    }

    addMetric(rawData) {
        const isValid = this.validateMetric(rawData);
        if (!isValid) {
            const errors = this.validateMetric.errors.map(err => 
                `${err.instancePath} ${err.message}`
            ).join(', ');
            throw new Error(`Invalid metric format: ${errors}`);
        }
        this.queue.push(rawData);

        // Vérification des alertes pour chaque métrique
        this.alertChecker.check(rawData);
    }

    processQueue() {
        if (this.queue.length === 0) return;
        console.table(this.queue); // ⏭️ J2: Remplace par l'envoi vers InfluxDB/Prometheus 
        this.queue = [];
    }

    // Pour les tests
    cleanup() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
