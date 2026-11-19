import type { FastifyPluginAsync } from 'fastify';
import {
  getFavoriteContainers,
  createFavoriteContainer,
  updateFavoriteContainer,
  deleteFavoriteContainer,
  reorderFavoriteContainers,
  toggleFavorite,
  moveFavoriteItem,
  getAllFavoriteItemIds,
} from '../db/repository.js';
import type {
  CreateContainerInput,
  UpdateContainerInput,
  ToggleFavoriteInput,
  MoveFavoriteInput,
} from '@quarter-note/shared';

export const favoriteRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all containers with items
  fastify.get('/favorites', async () => {
    return getFavoriteContainers();
  });

  // Get quick map of all favorited IDs for UI hearts
  fastify.get('/favorites/ids', async () => {
    return getAllFavoriteItemIds();
  });

  // Toggle favorite status of any item
  fastify.post<{ Body: ToggleFavoriteInput }>('/favorites/toggle', async (request, reply) => {
    const { itemType, itemId, containerId } = request.body || {};
    if (!itemType || !itemId) {
      return reply.code(400).send({ error: 'itemType e itemId sono obbligatori' });
    }

    const validTypes = ['artist', 'album', 'track', 'playlist'];
    if (!validTypes.includes(itemType)) {
      return reply.code(400).send({ error: `Tipo elemento non valido: ${itemType}` });
    }

    const result = toggleFavorite(itemType, itemId, containerId);
    return result;
  });

  // Create a new container / divider
  fastify.post<{ Body: CreateContainerInput }>('/favorites/containers', async (request, reply) => {
    const { title } = request.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return reply.code(400).send({ error: 'Il titolo del contenitore è obbligatorio' });
    }

    const container = createFavoriteContainer(title.trim());
    return reply.code(201).send(container);
  });

  // Reorder containers
  fastify.put<{ Body: { containerIds: string[] } }>('/favorites/containers/reorder', async (request, reply) => {
    const { containerIds } = request.body || {};
    if (!Array.isArray(containerIds)) {
      return reply.code(400).send({ error: 'containerIds deve essere un array' });
    }

    reorderFavoriteContainers(containerIds);
    return { success: true };
  });

  // Update container / divider (title, position)
  fastify.put<{ Params: { id: string }; Body: UpdateContainerInput }>(
    '/favorites/containers/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { title, position } = request.body || {};

      const updated = updateFavoriteContainer(id, { title, position });
      if (!updated) {
        return reply.code(404).send({ error: 'Contenitore non trovato' });
      }

      return updated;
    }
  );

  // Delete container / divider
  fastify.delete<{ Params: { id: string } }>('/favorites/containers/:id', async (request, reply) => {
    const { id } = request.params;
    const deleted = deleteFavoriteContainer(id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Contenitore non trovato' });
    }

    return { success: true };
  });

  // Move an item to another container / position
  fastify.put<{ Params: { id: string }; Body: MoveFavoriteInput }>(
    '/favorites/items/:id/move',
    async (request, reply) => {
      const { id } = request.params;
      const { targetContainerId, position } = request.body || {};

      if (!targetContainerId) {
        return reply.code(400).send({ error: 'targetContainerId è obbligatorio' });
      }

      const moved = moveFavoriteItem(id, targetContainerId, position);
      if (!moved) {
        return reply.code(404).send({ error: 'Elemento preferito non trovato' });
      }

      return { success: true };
    }
  );
};
