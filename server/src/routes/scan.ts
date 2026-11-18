import type { FastifyPluginAsync } from 'fastify';
import type { ScannerService } from '../scanner/scanner.js';

export const scanRoutes = (scanner: ScannerService): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.post('/scan', async (_request, reply) => {
      await scanner.startScan();
      return reply.code(202).send(scanner.getStatus());
    });

    fastify.get('/scan/status', async () => {
      return scanner.getStatus();
    });
  };
};
