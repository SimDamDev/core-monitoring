import { MetricsPipeline } from '../core/metrics.mjs';
import { jest } from '@jest/globals';

describe('MetricsPipeline', () => {
    let pipeline;
    
    beforeEach(() => {
        jest.useFakeTimers();
        pipeline = new MetricsPipeline();
        // Mock console.table pour les tests
        console.table = jest.fn();
    });

    afterEach(() => {
        pipeline.cleanup();
        jest.useRealTimers();
        jest.clearAllTimers();
    });

    test('validateFormat valide correctement les métriques', () => {
        const validMetric = {
            timestamp: Date.now(),
            value: "123.45",
            unit: "MB"
        };
        
        const processed = pipeline.validateFormat(validMetric);
        expect(processed.value).toBe(123.45);
        expect(processed.unit).toBe("MB");
        expect(processed.timestamp).toBe(validMetric.timestamp);
    });

    test('validateFormat rejette les métriques invalides', () => {
        const invalidMetrics = [
            { value: "123.45" },
            { timestamp: Date.now() },
            null,
            undefined,
            "not an object",
            {}
        ];
        
        invalidMetrics.forEach(metric => {
            expect(() => pipeline.validateFormat(metric)).toThrow('invalid metric format');
        });
    });

    test('addMetric ajoute à la queue', () => {
        const metric = {
            timestamp: Date.now(),
            value: 100,
            unit: "MB"
        };
        
        pipeline.addMetric(metric);
        expect(pipeline.queue.length).toBe(1);
        expect(pipeline.queue[0].value).toBe(100);
    });

    test('processQueue traite les métriques par batch', () => {
        const timestamp = Date.now();
        
        // Ajoute 3 métriques valides
        for(let i = 0; i < 3; i++) {
            pipeline.addMetric({
                timestamp: timestamp + i,
                value: i,
                unit: "MB"
            });
        }
        
        expect(pipeline.queue.length).toBe(3);
        
        // Avance le temps de 1 seconde pour déclencher l'intervalle
        jest.advanceTimersByTime(1000);
        
        // Vérifie que la queue est vide après traitement
        expect(pipeline.queue.length).toBe(0);
        expect(console.table).toHaveBeenCalledTimes(1);
    });
}); 