import { MetricsScheduler } from '../core/scheduler.mjs';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('MetricsScheduler - Collecte Intelligente', () => {
    let scheduler;
    let mockPlugin;
    let mockWorker;

    beforeEach(() => {
        scheduler = new MetricsScheduler();
        mockWorker = {
            postMessage: jest.fn()
        };
        mockPlugin = {
            config: {
                refresh_profile: 'rapid'
            },
            worker: mockWorker
        };
    });

    afterEach(() => {
        scheduler.cleanup();
        jest.clearAllMocks();
    });

    it('ne collecte pas de métriques sans connexion active', () => {
        scheduler.addPlugin(mockPlugin);
        expect(scheduler.isCollecting).toBe(false);
        expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    it('démarre la collecte à la première connexion', () => {
        scheduler.addPlugin(mockPlugin);
        scheduler.incrementConnections();
        expect(scheduler.isCollecting).toBe(true);
        expect(scheduler.activeConnections).toBe(1);
    });

    it('maintient la collecte avec plusieurs connexions', () => {
        scheduler.addPlugin(mockPlugin);
        scheduler.incrementConnections(); // Client 1
        scheduler.incrementConnections(); // Client 2
        expect(scheduler.activeConnections).toBe(2);
        expect(scheduler.isCollecting).toBe(true);

        scheduler.decrementConnections(); // Client 1 se déconnecte
        expect(scheduler.activeConnections).toBe(1);
        expect(scheduler.isCollecting).toBe(true); // Toujours actif
    });

    it('arrête la collecte quand tous les clients sont déconnectés', () => {
        scheduler.addPlugin(mockPlugin);
        scheduler.incrementConnections();
        scheduler.decrementConnections();
        expect(scheduler.activeConnections).toBe(0);
        expect(scheduler.isCollecting).toBe(false);
    });

    it('émet un événement collection:stop quand la collecte s\'arrête', (done) => {
        scheduler.addPlugin(mockPlugin);
        scheduler.incrementConnections();
        
        scheduler.on('collection:stop', () => {
            expect(scheduler.isCollecting).toBe(false);
            done();
        });

        scheduler.decrementConnections();
    });

    it('gère correctement les plugins ajoutés pendant la collecte', async () => {
        scheduler.incrementConnections();
        expect(scheduler.isCollecting).toBe(true);

        // On attend un peu pour laisser le temps à l'intervalle de se mettre en place
        scheduler.addPlugin(mockPlugin);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(scheduler.collectionIntervals.has(mockPlugin)).toBe(true);
    });
}); 