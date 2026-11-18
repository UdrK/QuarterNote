import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { getTrackById } from '../db/repository.js';

function getMimeType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.flac':
      return 'audio/flac';
    case '.m4a':
    case '.aac':
      return 'audio/mp4';
    case '.ogg':
    case '.opus':
      return 'audio/ogg';
    case '.wav':
      return 'audio/wav';
    case '.wma':
      return 'audio/x-ms-wma';
    default:
      return 'application/octet-stream';
  }
}

export const streamRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>('/stream/:id', async (request, reply) => {
    const track = getTrackById(request.params.id);
    if (!track) {
      return reply.code(404).send({ error: 'Track not found' });
    }

    if (!fs.existsSync(track.filepath)) {
      return reply.code(404).send({ error: 'Audio file not found on disk' });
    }

    let stats: fs.Stats;
    try {
      stats = fs.statSync(track.filepath);
    } catch {
      return reply.code(500).send({ error: 'Unable to read audio file metadata' });
    }

    const fileSize = stats.size;
    const mimeType = getMimeType(track.filepath);
    const range = request.headers.range;

    if (range) {
      // Range header format: "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
        reply.header('Content-Range', `bytes */${fileSize}`);
        return reply.code(416).send({ error: 'Requested range not satisfiable' });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(track.filepath, { start, end });

      reply.code(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Length', chunkSize);
      reply.header('Content-Type', mimeType);

      return reply.send(fileStream);
    } else {
      // Full file request
      const fileStream = fs.createReadStream(track.filepath);

      reply.header('Content-Length', fileSize);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Type', mimeType);

      return reply.send(fileStream);
    }
  });
};
