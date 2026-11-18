import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import type { ScannerService } from '../scanner/scanner.js';
import { getLibraryStats, setSetting } from '../db/repository.js';
import type { UpdateSettingsInput } from '@quarter-note/shared';

export const settingsRoutes = (scanner: ScannerService, dataDir: string): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get('/settings', async () => {
      const stats = getLibraryStats();
      return {
        musicDir: scanner.getMusicDir(),
        dataDir,
        ...stats,
      };
    });

    fastify.put<{ Body: UpdateSettingsInput }>('/settings', async (request, reply) => {
      const { musicDir } = request.body || {};
      if (!musicDir || typeof musicDir !== 'string' || !musicDir.trim()) {
        return reply.code(400).send({ error: 'Il percorso della cartella musicale è obbligatorio' });
      }

      const resolvedPath = path.resolve(musicDir.trim());

      if (!fs.existsSync(resolvedPath)) {
        return reply.code(400).send({ error: `La cartella specificata non esiste sul disco: ${resolvedPath}` });
      }

      let stat: fs.Stats;
      try {
        stat = fs.statSync(resolvedPath);
      } catch {
        return reply.code(400).send({ error: 'Impossibile accedere al percorso specificato' });
      }

      if (!stat.isDirectory()) {
        return reply.code(400).send({ error: 'Il percorso indicato non è una cartella' });
      }

      // Update in scanner and database
      scanner.setMusicDir(resolvedPath);
      setSetting('music_dir', resolvedPath);

      const stats = getLibraryStats();
      return {
        musicDir: resolvedPath,
        dataDir,
        ...stats,
      };
    });
  };
};
