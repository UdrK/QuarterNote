<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Heart, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  Check, 
  X,
  GripVertical
} from '@lucide/vue';
import { 
  favoritesState, 
  loadFavorites, 
  createDivider, 
  renameDivider, 
  deleteDivider, 
  moveItem, 
  toggleFavorite 
} from '../stores/favorites';
import { playerActions, formatTime } from '../stores/player';
import type { FavoriteContainer, FavoriteItem } from '@quarter-note/shared';
import { fetchAlbum, fetchPlaylist } from '../api/client';

const router = useRouter();

const showNewDividerDialog = ref(false);
const newDividerTitle = ref('');
const editingDividerId = ref<string | null>(null);
const editingTitle = ref('');

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

  // Clear any stuck :active or focus states in browser
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
async function handleCreateDivider() {
  if (!newDividerTitle.value.trim()) return;
  try {
    await createDivider(newDividerTitle.value.trim());
    newDividerTitle.value = '';
    showNewDividerDialog.value = false;
  } catch (err) {
    console.error('Failed to create divider:', err);
  }
}

function startRename(container: FavoriteContainer) {
  editingDividerId.value = container.id;
  editingTitle.value = container.title;
}

async function saveRename(id: string) {
  if (!editingTitle.value.trim()) return;
  try {
    await renameDivider(id, editingTitle.value.trim());
    editingDividerId.value = null;
  } catch (err) {
    console.error('Failed to rename divider:', err);
  }
}

async function handleDeleteContainer(id: string, title: string) {
  if (!confirm(`Vuoi davvero eliminare la categoria "${title}" e i suoi elementi preferiti?`)) return;
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
  <div class="space-y-6 font-mono select-none">
    <!-- View Header in BBS Style -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[#ff3366] font-bold text-sm">■ [ ARCHIVIO PREFERITI ]</span>
          <span class="text-xs text-[#ffff00]">[{{ favoritesState.containers.length }} CATEGORIE]</span>
        </div>
        <p class="text-[11px] text-[#777777] mt-0.5">&gt; Organizza artisti, album, brani e playlist con il drag &amp; drop</p>
      </div>

      <!-- Create Category Button -->
      <button
        @click="showNewDividerDialog = true"
        class="bbs-btn bbs-btn-yellow py-1.5 px-3 text-xs self-start sm:self-auto"
      >
        <span>[+ CREA CATEGORIA]</span>
      </button>
    </div>

    <!-- Create Category Dialog in BBS Box -->
    <div
      v-if="showNewDividerDialog"
      class="p-3 border-2 border-[#ffff00] bg-black shadow-[0_0_15px_rgba(255,255,0,0.15)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
    >
      <span class="text-[#ffff00] text-xs font-bold">&gt; NOME CATEGORIA:</span>
      <input
        v-model="newDividerTitle"
        type="text"
        placeholder="Es: Heavy Metal, Chillout, In Viaggio..."
        class="flex-1 bg-[#0a0a0a] text-xs text-[#ffff00] px-3 py-1.5 border border-[#333333] focus:outline-none focus:border-[#ffff00]"
        @keyup.enter="handleCreateDivider"
        autofocus
      />
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button
          @click="handleCreateDivider"
          :disabled="!newDividerTitle.trim()"
          class="bbs-btn bbs-btn-yellow py-1 px-3 text-xs"
        >
          [SALVA]
        </button>
        <button
          @click="showNewDividerDialog = false"
          class="bbs-btn py-1 px-2 text-xs border-[#333333] text-[#888888]"
        >
          [ANNULLA]
        </button>
      </div>
    </div>

    <!-- Empty Global State -->
    <div v-if="!favoritesState.isLoading && favoritesState.containers.length === 0" class="border border-[#222222] p-12 text-center text-[#666666]">
      <p class="text-xs">&gt; NESSUNA CATEGORIA NEI PREFERITI &lt;</p>
    </div>

    <!-- Containers List -->
    <div v-else class="space-y-8">
      <section
        v-for="container in favoritesState.containers"
        :key="container.id"
        class="space-y-3 p-2 transition-colors border"
        :class="[
          dragOverContainerId === container.id
            ? 'border-[#00ffff] bg-[#001726]'
            : 'border-transparent'
        ]"
        @dragover="handleDragOver($event, container.id)"
        @dragenter="handleDragEnter(container.id)"
        @dragleave="handleDragLeave($event, container.id)"
        @drop="handleDrop($event, container.id)"
      >
        <!-- Horizontal ASCII Divider with Title in the Center -->
        <div class="relative flex items-center py-2 group/divider">
          <div 
            class="flex-grow border-t"
            :class="dragOverContainerId === container.id ? 'border-[#00ffff]' : 'border-[#333333] group-hover/divider:border-[#555555]'"
          />

          <!-- Divider Center Box -->
          <div 
            class="flex items-center gap-2 px-3 py-1 bg-black border transition-all"
            :class="[
              dragOverContainerId === container.id
                ? 'border-[#00ffff] text-[#ffff00] bg-[#002b4d]'
                : 'border-[#333333] group-hover/divider:border-[#00ffff]'
            ]"
          >
            <!-- Inline Edit Title -->
            <template v-if="editingDividerId === container.id">
              <input
                v-model="editingTitle"
                type="text"
                class="bg-black text-xs text-[#ffff00] font-bold px-1.5 py-0.5 border border-[#ffff00] focus:outline-none w-36 uppercase"
                @keyup.enter="saveRename(container.id)"
                @keyup.esc="editingDividerId = null"
                autofocus
              />
              <button @click="saveRename(container.id)" class="text-[#00ff66] text-xs font-bold px-1">
                [✓]
              </button>
              <button @click="editingDividerId = null" class="text-[#888888] text-xs font-bold px-1">
                [X]
              </button>
            </template>

            <!-- Normal Title -->
            <template v-else>
              <span class="text-xs font-bold uppercase tracking-wider" :class="dragOverContainerId === container.id ? 'text-[#ffff00]' : 'text-[#d4d4d4]'">
                ■ [ {{ container.title }} ]
              </span>

              <!-- Category Action Buttons (Rename, Delete) -->
              <div class="flex items-center gap-1 opacity-0 group-hover/divider:opacity-100 transition-opacity ml-1">
                <button
                  @click="startRename(container)"
                  title="Rinomina categoria"
                  class="text-[10px] text-[#888888] hover:text-[#00ffff]"
                >
                  [✎]
                </button>
                <button
                  @click="handleDeleteContainer(container.id, container.title)"
                  title="Elimina categoria"
                  class="text-[10px] text-[#888888] hover:text-[#ff3366]"
                >
                  [✕]
                </button>
              </div>
            </template>
          </div>

          <div 
            class="flex-grow border-t"
            :class="dragOverContainerId === container.id ? 'border-[#00ffff]' : 'border-[#333333] group-hover/divider:border-[#555555]'"
          />
        </div>

        <!-- Empty Container Drop Zone in BBS Box -->
        <div
          v-if="container.items.length === 0"
          class="border border-dashed p-6 text-center transition-colors"
          :class="[
            dragOverContainerId === container.id
              ? 'border-[#00ffff] bg-[#002233] text-[#00ffff]'
              : 'border-[#222222] text-[#555555]'
          ]"
        >
          <p class="text-xs">
            {{ dragOverContainerId === container.id ? '&gt;&gt; RILASCIA QUI PER SPOSTARE &lt;&lt;' : '+-- [ NESSUN ELEMENTO NELLA CATEGORIA ] --+' }}
          </p>
          <p class="text-[10px] text-[#666666] mt-1">
            Trascina qui qualsiasi elemento da un'altra categoria.
          </p>
        </div>

        <!-- Items Display -->
        <div v-else class="space-y-3">
          <!-- Tracks within container -->
          <div
            v-if="container.items.some(i => i.itemType === 'track')"
            class="border border-[#222222] bg-[#070707] space-y-0.5 mb-3"
          >
            <div
              v-for="(item, idx) in container.items.filter(i => i.itemType === 'track')"
              :key="item.id"
              draggable="true"
              @dragstart="handleDragStart($event, item, container.id)"
              @dragend="handleDragEnd($event)"
              class="group flex items-center justify-between px-2.5 py-1.5 text-xs select-none transition-colors border-b border-[#181818] hover:bg-[#001726] hover:border-[#00ffff]"
              :class="[
                draggedItem?.id === item.id ? 'opacity-30 bg-[#002b4d] border-[#00ffff]' : ''
              ]"
            >
              <!-- Left: Grip Handle + Info -->
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <span 
                  class="text-[#555555] group-hover:text-[#00ffff] cursor-grab font-bold p-0.5 shrink-0" 
                  title="Trascina per spostare"
                >
                  [::]
                </span>

                <div 
                  @click="item.track && playerActions.playTrack(item.track)"
                  class="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                >
                  <span class="w-5 text-center text-[#777777] text-[10px]">
                    {{ String(idx + 1).padStart(2, '0') }}.
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate">
                      {{ item.track?.title || 'Brano' }}
                    </p>
                    <p class="text-[10px] text-[#00ffff] opacity-80 truncate">
                      {{ item.track?.artistName }} • {{ item.track?.albumTitle }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button
                  @click.stop="toggleFavorite('track', item.itemId)"
                  class="text-[#ff3366] text-xs font-bold"
                  title="Rimuovi dai preferiti"
                >
                  [★]
                </button>
                <span v-if="item.track" class="w-12 text-right text-[10px] text-[#777777] tabular-nums">
                  {{ formatTime(item.track.duration) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cards (Artists, Albums, Playlists) within container -->
          <div
            v-if="container.items.some(i => i.itemType !== 'track')"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          >
            <div
              v-for="item in container.items.filter(i => i.itemType !== 'track')"
              :key="item.id"
              draggable="true"
              @dragstart="handleDragStart($event, item, container.id)"
              @dragend="handleDragEnd($event)"
              class="group relative flex flex-col p-2.5 bg-[#070707] border border-[#222222] hover:border-[#00ffff] hover:bg-[#001726] transition-colors cursor-pointer select-none"
              :class="[
                draggedItem?.id === item.id ? 'opacity-30 bg-[#002b4d] border-[#00ffff]' : ''
              ]"
              @click="handleNavigate(item)"
            >
              <!-- Top bar with grip icon, type badge and un-favorite -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span 
                    class="text-[#555555] group-hover:text-[#00ffff] cursor-grab font-bold shrink-0 text-xs" 
                    title="Trascina per spostare"
                  >
                    [::]
                  </span>

                  <span
                    class="text-[9px] font-bold px-1 text-black uppercase"
                    :class="[
                      item.itemType === 'artist' ? 'bg-[#00ffff]' :
                      item.itemType === 'album' ? 'bg-[#ffff00]' :
                      'bg-[#00ff66]'
                    ]"
                  >
                    {{ item.itemType === 'artist' ? 'ARTISTA' : item.itemType === 'album' ? 'ALBUM' : 'PLAYLIST' }}
                  </span>
                </div>

                <button
                  @click.stop="toggleFavorite(item.itemType, item.itemId)"
                  class="text-[#ff3366] text-xs font-bold"
                  title="Rimuovi dai preferiti"
                >
                  [★]
                </button>
              </div>

              <!-- Media thumbnail -->
              <!-- Artist -->
              <div v-if="item.itemType === 'artist'" class="flex flex-col items-center text-center my-1">
                <div class="w-20 h-20 bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-1.5">
                  <img
                    :src="item.artist?.imageUrl || `/api/artists/${item.itemId}/image`"
                    :alt="item.artist?.name || 'Artista'"
                    class="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                </div>
                <h4 class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate w-full">
                  {{ item.artist?.name || 'Artista' }}
                </h4>
                <p class="text-[10px] text-[#00ffff]/80 mt-0.5">
                  [{{ item.artist?.albumCount || 0 }} ALBUM]
                </p>
              </div>

              <!-- Album -->
              <div v-else-if="item.itemType === 'album'" class="flex flex-col">
                <div class="relative aspect-square bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-1.5">
                  <img
                    :src="`/api/cover/${item.itemId}`"
                    :alt="item.album?.title || 'Album'"
                    class="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                  <!-- Quick play button -->
                  <button
                    @click.stop="playAlbumItem(item.itemId)"
                    class="absolute bottom-1 right-1 bbs-btn bbs-btn-green py-0.5 px-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Riproduci album"
                  >
                    [▶]
                  </button>
                </div>
                <h4 class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate" :title="item.album?.title">
                  {{ item.album?.title || 'Album' }}
                </h4>
                <p class="text-[10px] text-[#00ffff] truncate mt-0.5 opacity-80">
                  &gt; {{ item.album?.artistName }}
                </p>
              </div>

              <!-- Playlist -->
              <div v-else-if="item.itemType === 'playlist'" class="flex flex-col">
                <div class="relative aspect-square bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-1.5">
                  <img
                    :src="`/api/playlists/${item.itemId}/cover`"
                    :alt="item.playlist?.name || 'Playlist'"
                    class="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                  <!-- Quick play button -->
                  <button
                    @click.stop="playPlaylistItem(item.itemId)"
                    class="absolute bottom-1 right-1 bbs-btn bbs-btn-green py-0.5 px-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Riproduci playlist"
                  >
                    [▶]
                  </button>
                </div>
                <h4 class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#00ff66] truncate">
                  {{ item.playlist?.name || 'Playlist' }}
                </h4>
                <p class="text-[10px] text-[#888888] mt-0.5">
                  [{{ item.playlist?.trackCount || 0 }} BRANI]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
