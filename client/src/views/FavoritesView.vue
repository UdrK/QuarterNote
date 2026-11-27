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
const movingItemState = ref<{ item: FavoriteItem; fromContainerId: string } | null>(null);

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

function handleMoveRequest(item: FavoriteItem, fromContainerId: string) {
  movingItemState.value = { item, fromContainerId };
}

async function confirmMoveToContainer(targetContainerId: string) {
  if (!movingItemState.value) return;
  const { item, fromContainerId } = movingItemState.value;
  movingItemState.value = null;
  if (fromContainerId === targetContainerId) return;
  try {
    await moveItem(item.id, targetContainerId);
  } catch (err) {
    console.error('Failed to move favorite item:', err);
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
          :can-move="favoritesState.containers.length > 1"
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
          @move-request="handleMoveRequest"
        />
      </div>

      <!-- Touch-friendly Move to Category Modal -->
      <div
        v-if="movingItemState"
        class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 font-mono"
        @click.self="movingItemState = null"
      >
        <div class="bg-theme-panel border-2 border-theme-border w-full max-w-sm shadow-2xl overflow-hidden">
          <div class="px-3 py-2 border-b border-theme-border-dim bg-theme-header-bg flex items-center justify-between">
            <h3 class="text-xs font-bold text-theme-header-fg">■ [ {{ t('favorites.moveTitle') }} ]</h3>
            <button @click="movingItemState = null" class="bbs-btn py-0.5 px-1.5 text-xs border-theme-border-dim">
              [X]
            </button>
          </div>
          <div class="p-2 space-y-1 bg-theme-surface max-h-72 overflow-y-auto">
            <button
              v-for="target in favoritesState.containers.filter(c => c.id !== movingItemState?.fromContainerId)"
              :key="target.id"
              @click="confirmMoveToContainer(target.id)"
              class="w-full flex items-center justify-between px-3 py-2 text-xs text-theme-text border border-theme-border-subtle hover:bg-theme-active-bg hover:border-theme-accent hover:text-white transition-colors cursor-pointer"
            >
              <span class="font-bold uppercase truncate">&gt; {{ target.title }}</span>
              <span class="text-[10px] text-theme-text-dim shrink-0 ml-2">[{{ target.items.length }}]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
