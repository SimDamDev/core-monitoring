import { Transform } from 'stream';
import { stringify } from 'csv-stringify/sync';

export async function exportRoutes(fastify) {
  fastify.get('/export/json', async (request, reply) => {
    try {
      if (!fastify.storage) {
        throw new Error('Storage not initialized');
      }
      const metrics = await fastify.storage.getLast24h();
      return metrics || [];
    } catch (error) {
      request.log.error(error);
      throw new Error('Failed to fetch metrics');
    }
  });

  fastify.get('/export/csv', async (request, reply) => {
    try {
      if (!fastify.storage) {
        throw new Error('Storage not initialized');
      }

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename=metrics.csv');

      const metrics = await fastify.storage.getLast24h();
      const csvData = stringify(metrics, {
        header: true,
        columns: ['source', 'value', 'unit', 'timestamp']
      });

      return csvData;
    } catch (error) {
      request.log.error(error);
      throw new Error('Failed to fetch metrics');
    }
  });
} 