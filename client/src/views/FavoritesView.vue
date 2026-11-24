<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  favoritesState, 
  loadFavorites, 
  createDivider, 
  renameDivider, 
  deleteDivider, 
  moveItem, 
  toggleFavorite 
} from '../stores/favorites';
import { playerActions } from '../stores/player';
import type { FavoriteContainer, FavoriteItem } from '@quarter-note/shared';
import { fetchAlbum, fetchPlaylist } from '../api/client';
import TuiWindow from '../components/TuiWindow.vue';
import FavoriteDividerModal from '../components/favorites/FavoriteDividerModal.vue';
import FavoriteContainerBox from '../components/favorites/FavoriteContainerBox.vue';
import { t } from '../i18n';

const router = useRouter();

const showNewDividerDialog = ref(false);
const editingDividerId = ref<string | null>(null);

// HTML5 Drag and Drop states
const draggedItem = ref<FavoriteItem | null>(null);
const draggedFromContainerId = ref<string | null>(null);
const dragOverContainerId = ref<string | null>(null);

onMounted(async () => {
  await loadFavorites();
});

// Drag and drop handlers
function handleDragStart(event: DragEvent, item: FavoriteItem, containerId: string) {
  draggedItem.value = item;
  draggedFromContainerId.value = containerId;

  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', item.id);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragEnd(event?: DragEvent) {
  draggedItem.value = null;
  draggedFromContainerId.value = null;
  dragOverContainerId.value = null;

  if (event?.target && (event.target as HTMLElement).blur) {
    (event.target as HTMLElement).blur();
  }
}

function handleDragOver(event: DragEvent, containerId: string) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  if (dragOverContainerId.value !== containerId) {
    dragOverContainerId.value = containerId;
  }
}

function handleDragEnter(containerId: string) {
  dragOverContainerId.value = containerId;
}

function handleDragLeave(event: DragEvent, containerId: string) {
  const currentTarget = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;
  if (!currentTarget.contains(relatedTarget)) {
    if (dragOverContainerId.value === containerId) {
      dragOverContainerId.value = null;
    }
  }
}

async function handleDrop(event: DragEvent, targetContainerId: string) {
  event.preventDefault();
  const item = draggedItem.value;
  const fromContainerId = draggedFromContainerId.value;

  handleDragEnd(event);

  if (!item || !fromContainerId) return;
  if (fromContainerId === targetContainerId) return;

  try {
    await moveItem(item.id, targetContainerId);
  } catch (err) {
    console.error('Failed to move favorite item:', err);
  }
}

// Category handlers
async function handleCreateDivider(title: string) {
  try {
    await createDivider(title);
    showNewDividerDialog.value = false;
  } catch (err) {
    console.error('Failed to create divider:', err);
  }
}

function startRename(container: FavoriteContainer) {
  editingDividerId.value = container.id;
}

async function saveRename(id: string, newTitle: string) {
  try {
    await renameDivider(id, newTitle);
    editingDividerId.value = null;
  } catch (err) {
    console.error('Failed to rename divider:', err);
  }
}

async function handleDeleteContainer(id: string, title: string) {
  if (!confirm(t('favorites.deleteConfirm', { title }))) return;
  try {
    await deleteDivider(id);
  } catch (err) {
    console.error('Failed to delete divider:', err);
  }
}

// Quick play functions
async function playAlbumItem(albumId: string) {
  try {
    const { tracks } = await fetchAlbum(albumId);
    if (tracks.length > 0) {
      playerActions.playTrack(tracks[0], tracks);
    }
  } catch (err) {
    console.error('Failed to play album:', err);
  }
}

async function playPlaylistItem(playlistId: string) {
  try {
    const { tracks } = await fetchPlaylist(playlistId);
    const raw = tracks.map(t => t.track);
    if (raw.length > 0) {
      playerActions.playTrack(raw[0], raw);
    }
  } catch (err) {
    console.error('Failed to play playlist:', err);
  }
}

function handleNavigate(item: FavoriteItem) {
  if (item.itemType === 'artist') {
    router.push(`/artists/${item.itemId}`);
  } else if (item.itemType === 'album') {
    router.push(`/albums/${item.itemId}`);
  } else if (item.itemType === 'playlist') {
    router.push(`/playlists/${item.itemId}`);
  } else if (item.itemType === 'track' && item.track) {
    playerActions.playTrack(item.track);
  }
}
</script>

<template>
  <TuiWindow 
    :title="t('favorites.title')" 
    :badge="t('favorites.categoriesBadge', { count: favoritesState.containers.length })" 
    hotkey="F4"
    variant="default"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-dim pb-2">
        <div class="text-[11px] text-theme-text-dim">
          {{ t('favorites.subtitle') }}
        </div>

        <button
          @click="showNewDividerDialog = true"
          class="bg-theme-accent hover:opacity-90 text-theme-accent-contrast font-extrabold px-3 py-1 text-xs border border-theme-accent transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{{ t('favorites.createCategory') }}</span>
        </button>
      </div>

      <!-- Create Category Dialog Box -->
      <FavoriteDividerModal
        v-model="showNewDividerDialog"
        @create="handleCreateDivider"
      />

      <!-- Containers List -->
      <div class="space-y-6">
        <FavoriteContainerBox
          v-for="container in favoritesState.containers"
          :key="container.id"
          :container="container"
          :drag-over-container-id="dragOverContainerId"
          :dragged-item-id="draggedItem?.id"
          :editing-divider-id="editingDividerId"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
          @start-rename="startRename"
          @save-rename="saveRename"
          @cancel-rename="editingDividerId = null"
          @delete="handleDeleteContainer"
          @toggle-favorite="toggleFavorite"
          @navigate="handleNavigate"
          @play-track="(item) => item.track && playerActions.playTrack(item.track)"
          @play-album="playAlbumItem"
          @play-playlist="playPlaylistItem"
        />
      </div>
    </div>
  </TuiWindow>
</template>
