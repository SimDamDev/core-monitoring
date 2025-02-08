export class MetricsPipeline {
    constructor() {
        this.queue = [];
        this.interval = setInterval(() => this.processQueue(), 1000); //Batch processing
    }

    addMetric(rawData) {
        const validMetric = this.validateFormat(rawData);
        this.queue.push(validMetric);
    }

    validateFormat(data) {
        if (!data || typeof data !== 'object') throw 'invalid metric format';
        if (typeof data.timestamp === 'undefined' || typeof data.value === 'undefined') {
            throw 'invalid metric format';
        }

        return {
            timestamp: data.timestamp,
            value: Number(data.value),
            unit: data.unit || 'unknown'
        };
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
