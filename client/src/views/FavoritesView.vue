<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Heart, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Play, 
  Users, 
  Disc3, 
  ListMusic, 
  Music2, 
  FolderInput, 
  Check, 
  X,
  ChevronDown
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
import TrackRow from '../components/TrackRow.vue';
import type { FavoriteContainer, FavoriteItem, FavoriteItemType } from '@quarter-note/shared';
import { fetchAlbum, fetchPlaylist } from '../api/client';

const router = useRouter();

const showNewDividerDialog = ref(false);
const newDividerTitle = ref('');
const editingDividerId = ref<string | null>(null);
const editingTitle = ref('');

// Popover state for moving an item
const activeMoveMenuFavoriteId = ref<string | null>(null);

onMounted(async () => {
  await loadFavorites();
});

async function handleCreateDivider() {
  const title = newDividerTitle.value.trim();
  if (!title) return;
  try {
    await createDivider(title);
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
  const title = editingTitle.value.trim();
  if (!title) {
    editingDividerId.value = null;
    return;
  }
  try {
    await renameDivider(id, title);
  } catch (err) {
    console.error('Failed to rename divider:', err);
  } finally {
    editingDividerId.value = null;
  }
}

async function handleDeleteContainer(id: string, title: string) {
  if (!confirm(`Vuoi davvero eliminare il divisore "${title}" e i suoi elementi preferiti?`)) return;
  try {
    await deleteDivider(id);
  } catch (err) {
    console.error('Failed to delete divider:', err);
  }
}

async function handleMove(favoriteId: string, targetContainerId: string) {
  activeMoveMenuFavoriteId.value = null;
  try {
    await moveItem(favoriteId, targetContainerId);
  } catch (err) {
    console.error('Failed to move favorite item:', err);
  }
}

function toggleMoveMenu(favoriteId: string, event: Event) {
  event.stopPropagation();
  if (activeMoveMenuFavoriteId.value === favoriteId) {
    activeMoveMenuFavoriteId.value = null;
  } else {
    activeMoveMenuFavoriteId.value = favoriteId;
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
  <div class="p-6 space-y-8 max-w-7xl mx-auto" @click="activeMoveMenuFavoriteId = null">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-sm">
          <Heart class="w-5 h-5 fill-rose-500" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-100">Preferiti</h1>
          <p class="text-xs text-slate-400">Organizza artisti, album, brani e playlist con divisori personalizzati</p>
        </div>
      </div>

      <!-- Add Divider Button -->
      <button
        @click="showNewDividerDialog = true"
        class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold text-xs rounded-xl shadow transition-all hover:scale-105 self-start sm:self-auto cursor-pointer"
      >
        <Plus class="w-4 h-4 text-sky-400" />
        <span>Aggiungi Divisore</span>
      </button>
    </div>

    <!-- Create Divider Modal/Dialog -->
    <div
      v-if="showNewDividerDialog"
      class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in"
    >
      <input
        v-model="newDividerTitle"
        type="text"
        placeholder="Nome del nuovo divisore (es: Colonna sonora, Rock preferito...)"
        class="flex-1 bg-slate-950 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 font-medium"
        @keyup.enter="handleCreateDivider"
        autofocus
      />
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button
          @click="handleCreateDivider"
          :disabled="!newDividerTitle.trim()"
          class="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
        >
          Crea Divisore
        </button>
        <button
          @click="showNewDividerDialog = false"
          class="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Annulla
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="favoritesState.isLoading && favoritesState.containers.length === 0" class="space-y-6 animate-pulse">
      <div class="h-6 bg-slate-800/60 rounded w-1/4 mx-auto" />
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="n in 4" :key="n" class="h-32 bg-slate-900/40 rounded-xl" />
      </div>
    </div>

    <!-- Containers List -->
    <div v-else class="space-y-10">
      <section
        v-for="container in favoritesState.containers"
        :key="container.id"
        class="space-y-4"
      >
        <!-- Horizontal Divider with Title in the Center -->
        <div class="relative flex items-center py-4 group/divider">
          <div class="flex-grow border-t border-slate-800 group-hover/divider:border-slate-700/80 transition-colors"></div>

          <!-- Divider Center Pill -->
          <div class="flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-slate-900 border border-slate-800 group-hover/divider:border-sky-500/50 shadow-md transition-all select-none">
            <!-- Inline Edit Title -->
            <template v-if="editingDividerId === container.id">
              <input
                v-model="editingTitle"
                type="text"
                class="bg-slate-950 text-xs text-slate-100 font-bold px-2 py-0.5 rounded border border-sky-500 focus:outline-none w-36 uppercase tracking-wider"
                @keyup.enter="saveRename(container.id)"
                @keyup.esc="editingDividerId = null"
                autofocus
              />
              <button @click="saveRename(container.id)" class="text-emerald-400 hover:text-emerald-300 p-0.5">
                <Check class="w-3.5 h-3.5" />
              </button>
              <button @click="editingDividerId = null" class="text-slate-400 hover:text-slate-300 p-0.5">
                <X class="w-3.5 h-3.5" />
              </button>
            </template>

            <!-- Normal Title -->
            <template v-else>
              <span class="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                {{ container.title }}
              </span>
              <span class="text-[10px] font-mono font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                {{ container.items.length }}
              </span>

              <!-- Divider Action Buttons -->
              <div class="flex items-center gap-1 opacity-0 group-hover/divider:opacity-100 transition-opacity ml-1">
                <button
                  @click="startRename(container)"
                  title="Rinomina divisore"
                  class="p-1 text-slate-400 hover:text-sky-400 rounded transition-colors"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
                <button
                  @click="handleDeleteContainer(container.id, container.title)"
                  title="Elimina divisore"
                  class="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </template>
          </div>

          <div class="flex-grow border-t border-slate-800 group-hover/divider:border-slate-700/80 transition-colors"></div>
        </div>

        <!-- Container Items -->
        <!-- Empty state for this container -->
        <div
          v-if="container.items.length === 0"
          class="border border-dashed border-slate-800/80 rounded-2xl p-8 text-center bg-slate-950/20"
        >
          <p class="text-xs text-slate-500 font-medium">Nessun elemento in questo contenitore.</p>
          <p class="text-[11px] text-slate-600 mt-1">
            Aggiungi artisti, album o canzoni ai preferiti oppure sposta qui gli elementi usando il menu "Sposta in".
          </p>
        </div>

        <!-- Items grid -->
        <div v-else class="space-y-3">
          <!-- Tracks within container (rendered in a playlist-like table) -->
          <div
            v-if="container.items.some(i => i.itemType === 'track')"
            class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1 mb-4"
          >
            <div
              v-for="(item, idx) in container.items.filter(i => i.itemType === 'track')"
              :key="item.id"
              class="group flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-800/70 select-none transition-colors relative"
            >
              <div 
                @click="item.track && playerActions.playTrack(item.track)"
                class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <span class="w-5 text-center text-slate-500 font-mono text-[11px] group-hover:hidden">
                  {{ idx + 1 }}
                </span>
                <span class="w-5 hidden group-hover:flex items-center justify-center text-sky-400">
                  <Play class="w-3.5 h-3.5 fill-current" />
                </span>

                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-slate-200 truncate">{{ item.track?.title || 'Brano' }}</p>
                  <p class="text-[11px] text-slate-400 truncate">{{ item.track?.artistName }} • {{ item.track?.albumTitle }}</p>
                </div>
              </div>

              <!-- Track Actions -->
              <div class="flex items-center gap-2 shrink-0 ml-3">
                <!-- Move to container button -->
                <div class="relative">
                  <button
                    @click="toggleMoveMenu(item.id, $event)"
                    class="p-1.5 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-700/60 transition-colors"
                    title="Sposta in un altro contenitore"
                  >
                    <FolderInput class="w-3.5 h-3.5" />
                  </button>

                  <!-- Move Popover Menu -->
                  <div
                    v-if="activeMoveMenuFavoriteId === item.id"
                    class="absolute right-0 top-8 z-50 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1 backdrop-blur"
                  >
                    <div class="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      Sposta in contenitore:
                    </div>
                    <button
                      v-for="targetC in favoritesState.containers.filter(c => c.id !== container.id)"
                      :key="targetC.id"
                      @click="handleMove(item.id, targetC.id)"
                      class="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-sky-500/10 hover:text-sky-300 flex items-center justify-between transition-colors"
                    >
                      <span class="truncate">{{ targetC.title }}</span>
                      <span class="text-[10px] text-slate-500">({{ targetC.items.length }})</span>
                    </button>
                  </div>
                </div>

                <!-- Un-favorite heart -->
                <button
                  @click="toggleFavorite('track', item.itemId)"
                  class="p-1.5 text-rose-500 hover:text-rose-400 transition-colors"
                  title="Rimuovi dai preferiti"
                >
                  <Heart class="w-3.5 h-3.5 fill-rose-500" />
                </button>

                <!-- Duration -->
                <span v-if="item.track" class="w-12 text-right font-mono text-[11px] text-slate-400">
                  {{ formatTime(item.track.duration) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cards (Artists, Albums, Playlists) within container -->
          <div
            v-if="container.items.some(i => i.itemType !== 'track')"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <div
              v-for="item in container.items.filter(i => i.itemType !== 'track')"
              :key="item.id"
              class="group relative flex flex-col p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer shadow-sm hover:shadow-xl"
              @click="handleNavigate(item)"
            >
              <!-- Top bar with badges and actions -->
              <div class="flex items-center justify-between mb-2 z-10">
                <span
                  class="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                  :class="[
                    item.itemType === 'artist' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    item.itemType === 'album' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  ]"
                >
                  {{ item.itemType === 'artist' ? 'Artista' : item.itemType === 'album' ? 'Album' : 'Playlist' }}
                </span>

                <div class="flex items-center gap-1">
                  <!-- Move button -->
                  <div class="relative">
                    <button
                      @click="toggleMoveMenu(item.id, $event)"
                      class="p-1 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
                      title="Sposta in un altro contenitore"
                    >
                      <FolderInput class="w-3 h-3" />
                    </button>

                    <!-- Move Popover Menu -->
                    <div
                      v-if="activeMoveMenuFavoriteId === item.id"
                      class="absolute right-0 top-7 z-50 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1 backdrop-blur"
                      @click.stop
                    >
                      <div class="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        Sposta in:
                      </div>
                      <button
                        v-for="targetC in favoritesState.containers.filter(c => c.id !== container.id)"
                        :key="targetC.id"
                        @click="handleMove(item.id, targetC.id)"
                        class="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-sky-500/10 hover:text-sky-300 flex items-center justify-between transition-colors"
                      >
                        <span class="truncate">{{ targetC.title }}</span>
                        <span class="text-[10px] text-slate-500">({{ targetC.items.length }})</span>
                      </button>
                    </div>
                  </div>

                  <!-- Remove Favorite Heart -->
                  <button
                    @click.stop="toggleFavorite(item.itemType, item.itemId)"
                    class="p-1 rounded-full bg-slate-950/70 hover:bg-slate-800 text-rose-500 hover:text-rose-400 transition-colors"
                    title="Rimuovi dai preferiti"
                  >
                    <Heart class="w-3 h-3 fill-rose-500" />
                  </button>
                </div>
              </div>

              <!-- Media thumbnail -->
              <!-- Artist (Circular) -->
              <div v-if="item.itemType === 'artist'" class="flex flex-col items-center text-center my-2">
                <div class="w-20 h-20 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700/60 group-hover:border-purple-400/80 group-hover:scale-105 transition-all shadow-md mb-2">
                  <img
                    :src="`/api/artists/${item.itemId}/image`"
                    :alt="item.artist?.name || 'Artista'"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h4 class="text-xs font-bold text-slate-100 truncate w-full group-hover:text-purple-300 transition-colors">
                  {{ item.artist?.name || 'Artista' }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  {{ item.artist?.albumCount || 0 }} album
                </p>
              </div>

              <!-- Album (Square) -->
              <div v-else-if="item.itemType === 'album'" class="flex flex-col">
                <div class="relative aspect-square rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-md">
                  <img
                    :src="`/api/cover/${item.itemId}`"
                    :alt="item.album?.title || 'Album'"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <!-- Quick play button -->
                  <button
                    @click.stop="playAlbumItem(item.itemId)"
                    class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Riproduci album"
                  >
                    <Play class="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  </button>
                </div>
                <h4 class="text-xs font-bold text-slate-100 truncate group-hover:text-sky-300 transition-colors" :title="item.album?.title">
                  {{ item.album?.title || 'Album' }}
                </h4>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">
                  {{ item.album?.artistName }}
                </p>
              </div>

              <!-- Playlist -->
              <div v-else-if="item.itemType === 'playlist'" class="flex flex-col">
                <div class="relative aspect-square rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-md">
                  <img
                    :src="`/api/playlists/${item.itemId}/cover`"
                    :alt="item.playlist?.name || 'Playlist'"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <!-- Quick play button -->
                  <button
                    @click.stop="playPlaylistItem(item.itemId)"
                    class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Riproduci playlist"
                  >
                    <Play class="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  </button>
                </div>
                <h4 class="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                  {{ item.playlist?.name || 'Playlist' }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  {{ item.playlist?.trackCount || 0 }} brani
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
