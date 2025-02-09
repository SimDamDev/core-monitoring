import { AlertChecker } from '../core/alerts.mjs';
import { describe, it, expect, jest } from '@jest/globals';

describe('AlertChecker', () => {
    it('détecte correctement un dépassement CPU', () => {
        const mockLogger = { warn: jest.fn() };
        const checker = new AlertChecker(mockLogger);
        
        const metric = {
            source: 'cpu',
            value: 95,
            timestamp: Date.now(),
            unit: 'percent'
        };
        
        const result = checker.check(metric);
        expect(result).toBe(true);
        expect(mockLogger.warn).toHaveBeenCalledWith('[ALERT] cpu at 95%');
    });
    
    it('ignore les métriques sous le seuil', () => {
        const mockLogger = { warn: jest.fn() };
        const checker = new AlertChecker(mockLogger);
        
        const metric = {
            source: 'cpu',
            value: 85,
            timestamp: Date.now(),
            unit: 'percent'
        };
        
        const result = checker.check(metric);
        expect(result).toBe(false);
        expect(mockLogger.warn).not.toHaveBeenCalled();
    });
    
    it('ignore les métriques non surveillées', () => {
        const mockLogger = { warn: jest.fn() };
        const checker = new AlertChecker(mockLogger);
        
        const metric = {
            source: 'disk',
            value: 95,
            timestamp: Date.now(),
            unit: 'percent'
        };
        
        const result = checker.check(metric);
        expect(result).toBe(false);
        expect(mockLogger.warn).not.toHaveBeenCalled();
    });
}); 