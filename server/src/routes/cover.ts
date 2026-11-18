import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="250" height="250" rx="8" fill="url(#bgGrad)"/>
  <circle cx="125" cy="125" r="50" fill="#334155" opacity="0.4"/>
  <path d="M135 90 v45 a15 15 0 1 1 -12 -14.7 v-30.3 h25 v-10 h-35 v55 a25 25 0 1 0 22 24.7 v-64.7 z" fill="#94a3b8"/>
</svg>`;

export const coverRoutes = (dataDir: string): FastifyPluginAsync => {
  const coversDir = path.join(dataDir, 'covers');

  return async (fastify) => {
    fastify.get<{ Params: { albumId: string } }>('/cover/:albumId', async (request, reply) => {
      const { albumId } = request.params;
      const coverFile = path.join(coversDir, `${albumId}.webp`);

      if (fs.existsSync(coverFile)) {
        reply.header('Content-Type', 'image/webp');
        reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return reply.send(fs.createReadStream(coverFile));
      }

      // Fallback SVG
      reply.header('Content-Type', 'image/svg+xml');
      reply.header('Cache-Control', 'public, max-age=86400');
      return reply.send(PLACEHOLDER_SVG);
    });
  };
};
