import { MetricsPipeline } from '../core/metrics.mjs';
import { jest } from '@jest/globals';

describe('MetricsPipeline - Validation', () => {
    let pipeline;

    beforeEach(() => {
        jest.useFakeTimers();
        pipeline = new MetricsPipeline();
        console.table = jest.fn();
    });

    afterEach(() => {
        pipeline.cleanup();
        jest.useRealTimers();
        jest.clearAllTimers();
    });

    test('accepte une métrique valide', () => {
        const validMetric = {
            timestamp: Date.now(),
            value: 42,
            source: 'test-plugin',
            unit: '%',
            name: 'cpu-usage'
        };

        expect(() => pipeline.addMetric(validMetric)).not.toThrow();
        expect(pipeline.queue.length).toBe(1);
        expect(pipeline.queue[0]).toEqual(validMetric);
    });

    test('rejette une métrique sans timestamp', () => {
        const invalidMetric = {
            value: 42,
            source: 'test-plugin',
            unit: '%'
        };

        expect(() => pipeline.addMetric(invalidMetric))
            .toThrow(/must have required property 'timestamp'/);
    });

    test('rejette une valeur non numérique', () => {
        const invalidMetric = {
            timestamp: Date.now(),
            value: "42",
            source: 'test-plugin',
            unit: '%'
        };

        expect(() => pipeline.addMetric(invalidMetric))
            .toThrow(/value must be number/);
    });

    test('rejette une unité non supportée', () => {
        const invalidMetric = {
            timestamp: Date.now(),
            value: 42,
            source: 'test-plugin',
            unit: 'invalid'
        };

        expect(() => pipeline.addMetric(invalidMetric))
            .toThrow(/unit must be equal to one of the allowed values/);
    });

    test('rejette un ID de plugin invalide', () => {
        const invalidMetric = {
            timestamp: Date.now(),
            value: 42,
            source: 'TEST@invalid',
            unit: '%'
        };

        expect(() => pipeline.addMetric(invalidMetric))
            .toThrow(/source must match format "plugin-id"/);
    });

    test('rejette les propriétés additionnelles', () => {
        const invalidMetric = {
            timestamp: Date.now(),
            value: 42,
            source: 'test-plugin',
            unit: '%',
            extraField: 'should not be here'
        };

        expect(() => pipeline.addMetric(invalidMetric))
            .toThrow(/must NOT have additional properties/);
    });

    test('processQueue traite les métriques par batch', () => {
        const validMetric = {
            timestamp: Date.now(),
            value: 42,
            source: 'test-plugin',
            unit: '%'
        };

        pipeline.addMetric(validMetric);
        pipeline.addMetric({...validMetric, value: 43});
        
        expect(pipeline.queue.length).toBe(2);
        jest.advanceTimersByTime(1000);
        expect(pipeline.queue.length).toBe(0);
        expect(console.table).toHaveBeenCalledTimes(1);
    });
}); 