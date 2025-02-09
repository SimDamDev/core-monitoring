import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Fastify from 'fastify';
import { exportRoutes } from '../routes/export.mjs';
import { Storage } from '../core/storage.mjs';

describe('Routes Export', () => {
    let fastify;
    let storage;

    beforeAll(async () => {
        try {
            // Initialisation de la base de données en mémoire
            storage = new Storage(':memory:');
            
            // Attendre explicitement que la base de données soit initialisée
            await storage.ready;
            console.log('Base de données initialisée');

            // Initialisation de Fastify
            fastify = Fastify();
            fastify.decorate('storage', storage);
            await exportRoutes(fastify);
            await fastify.ready();
            console.log('Fastify initialisé');

            // Insertion de données de test
            await storage.insertMetric({
                source: 'cpu',
                value: 75,
                unit: '%',
                timestamp: Date.now(),
                name: 'test.metric'
            });
            console.log('Données de test insérées');
        } catch (error) {
            console.error('Erreur dans beforeAll:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            if (fastify) {
                await fastify.close();
            }
            if (storage) {
                await storage.cleanup();
            }
        } catch (error) {
            console.error('Erreur dans afterAll:', error);
        }
    });

    it('retourne les métriques en JSON', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/export/json'
        });

        expect(response.statusCode).toBe(200);
        const metrics = JSON.parse(response.payload);
        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[0]).toHaveProperty('source', 'cpu');
    });

    it('retourne les métriques en CSV', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/export/csv'
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('text/csv');
        expect(response.headers['content-disposition']).toBe('attachment; filename=metrics.csv');
        
        const csvLines = response.payload.split('\n');
        expect(csvLines[0]).toContain('source,value,unit,timestamp');
        expect(csvLines[1]).toContain('cpu');
    });
}); 