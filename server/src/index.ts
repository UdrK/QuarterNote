import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';

import { initDatabase } from './db/db.js';
import { getSetting } from './db/repository.js';
import { ScannerService } from './scanner/scanner.js';
import { libraryRoutes } from './routes/library.js';
import { streamRoutes } from './routes/stream.js';
import { coverRoutes } from './routes/cover.js';
import { playlistRoutes } from './routes/playlists.js';
import { scanRoutes } from './routes/scan.js';
import { settingsRoutes } from './routes/settings.js';
import { favoriteRoutes } from './routes/favorites.js';

// Configuration
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MUSIC_DIR = path.resolve(process.env.MUSIC_DIR || path.join(process.cwd(), 'music'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

// Look for client dist in monorepo or production container path
const possibleClientDirs = [
  process.env.CLIENT_DIR,
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
].filter(Boolean) as string[];

const CLIENT_DIR = possibleClientDirs.find(dir => fs.existsSync(path.join(dir, 'index.html')));

async function main() {
  console.log('----------------------------------------------------');
  console.log(' Quarter Note ♩ - Minimal Self-Hosted Music Streamer');
  console.log('----------------------------------------------------');
  // Initialize SQLite database
  initDatabase(DATA_DIR);

  // Check if music directory was saved in database settings
  const savedMusicDir = getSetting('music_dir');
  const activeMusicDir = savedMusicDir || MUSIC_DIR;

  console.log(`[Config] Music Directory : ${activeMusicDir} ${savedMusicDir ? '(from settings)' : '(default)'}`);
  console.log(`[Config] Data Directory  : ${DATA_DIR}`);
  console.log(`[Config] Client Directory: ${CLIENT_DIR || 'Not found (API only mode)'}`);

  // Initialize Scanner Service
  const scanner = new ScannerService(activeMusicDir, DATA_DIR);

  const fastify = Fastify({
    bodyLimit: 15 * 1024 * 1024, // 15MB for custom artist image uploads
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register API Routes
  await fastify.register(libraryRoutes(DATA_DIR), { prefix: '/api' });
  await fastify.register(streamRoutes, { prefix: '/api' });
  await fastify.register(coverRoutes(DATA_DIR), { prefix: '/api' });
  await fastify.register(playlistRoutes, { prefix: '/api' });
  await fastify.register(favoriteRoutes, { prefix: '/api' });
  await fastify.register(scanRoutes(scanner), { prefix: '/api' });
  await fastify.register(settingsRoutes(scanner, DATA_DIR), { prefix: '/api' });

  // Serve static client frontend if available
  if (CLIENT_DIR) {
    await fastify.register(fastifyStatic, {
      root: CLIENT_DIR,
      prefix: '/',
    });

    // SPA fallback: return index.html for non-API client routes
    fastify.setNotFoundHandler(async (request, reply) => {
      if (!request.raw.url?.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }

  // Health check endpoint
  fastify.get('/api/health', async () => ({ status: 'ok', name: 'Quarter Note ♩' }));

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`[Server] Running and listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
