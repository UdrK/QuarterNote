import type { FastifyPluginAsync } from 'fastify';
import {
  getArtists,
  getArtistById,
  getAlbums,
  getAlbumById,
  getTracks,
  getTrackById,
  search,
} from '../db/repository.js';

export const libraryRoutes: FastifyPluginAsync = async (fastify) => {
  // Artists
  fastify.get('/artists', async () => {
    return getArtists();
  });

  fastify.get<{ Params: { id: string } }>('/artists/:id', async (request, reply) => {
    const artist = getArtistById(request.params.id);
    if (!artist) {
      return reply.code(404).send({ error: 'Artist not found' });
    }
    return artist;
  });

  // Albums
  fastify.get<{ Querystring: { artistId?: string } }>('/albums', async (request) => {
    return getAlbums(request.query.artistId);
  });

  fastify.get<{ Params: { id: string } }>('/albums/:id', async (request, reply) => {
    const album = getAlbumById(request.params.id);
    if (!album) {
      return reply.code(404).send({ error: 'Album not found' });
    }
    return album;
  });

  // Tracks
  fastify.get('/tracks', async () => {
    return getTracks();
  });

  fastify.get<{ Params: { id: string } }>('/tracks/:id', async (request, reply) => {
    const track = getTrackById(request.params.id);
    if (!track) {
      return reply.code(404).send({ error: 'Track not found' });
    }
    return track;
  });

  // Search
  fastify.get<{ Querystring: { q: string } }>('/search', async (request) => {
    const query = request.query.q || '';
    if (!query.trim()) {
      return { artists: [], albums: [], tracks: [] };
    }
    return search(query);
  });
};
