<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchPlaylists, createPlaylist, addTracksToPlaylist } from '../api/client';
import type { Track, Playlist } from '@quarter-note/shared';

const props = defineProps<{
  track: Track;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const playlists = ref<Playlist[]>([]);
const newName = ref('');
const isCreating = ref(false);
const addedTo = ref<string | null>(null);

async function load() {
  try {
    playlists.value = await fetchPlaylists();
  } catch (err) {
    console.error('Failed to load playlists:', err);
  }
}

async function handleAddTo(playlistId: string) {
  try {
    await addTracksToPlaylist(playlistId, [props.track.id]);
    addedTo.value = playlistId;
    setTimeout(() => {
      emit('close');
    }, 600);
  } catch (err) {
    console.error('Failed to add track to playlist:', err);
  }
}

async function handleCreateAndAdd() {
  if (!newName.value.trim()) return;
  try {
    isCreating.value = true;
    const pl = await createPlaylist(newName.value.trim());
    await addTracksToPlaylist(pl.id, [props.track.id]);
    addedTo.value = pl.id;
    setTimeout(() => {
      emit('close');
    }, 600);
  } catch (err) {
    console.error('Failed to create playlist:', err);
  } finally {
    isCreating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 font-mono">
    <div class="bg-theme-panel border-2 border-theme-border w-full max-w-sm shadow-2xl overflow-hidden select-none">
      <!-- Header -->
      <div class="px-4 py-2 border-b border-theme-border-dim bg-theme-header-bg flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-theme-header-fg">■ [ ADD TO PLAYLIST ]</h3>
          <p class="text-[10px] text-theme-header-fg/80 truncate max-w-[240px]">&gt; {{ track.title }}</p>
        </div>
        <button @click="emit('close')" class="bbs-btn py-0.5 px-1.5 text-xs border-theme-border-dim">
          [X]
        </button>
      </div>

      <!-- New playlist form -->
      <div class="p-3 border-b border-theme-border-subtle bg-theme-surface">
        <form @submit.prevent="handleCreateAndAdd" class="flex items-center gap-2">
          <input
            v-model="newName"
            type="text"
            placeholder="New playlist name..."
            class="flex-1 bg-theme-bg text-xs text-theme-highlight px-2.5 py-1.5 border border-theme-border-dim focus:outline-none focus:border-theme-accent"
          />
          <button
            type="submit"
            :disabled="!newName.trim() || isCreating"
            class="bbs-btn py-1.5 px-3 text-xs bg-theme-panel text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast disabled:opacity-40"
          >
            [+ CREATE]
          </button>
        </form>
      </div>

      <!-- Playlists list -->
      <div class="max-h-60 overflow-y-auto p-2 space-y-1 bg-theme-surface">
        <div v-if="playlists.length === 0" class="text-center py-6 text-xs text-theme-text-dim italic">
          No playlists created.
        </div>

        <button
          v-for="pl in playlists"
          :key="pl.id"
          @click="handleAddTo(pl.id)"
          class="w-full flex items-center justify-between px-2.5 py-2 text-xs text-theme-text border border-theme-border-subtle hover:bg-theme-active-bg hover:border-theme-accent hover:text-white transition-colors group cursor-pointer"
        >
          <span class="truncate">&gt; {{ pl.name }}</span>
          <span v-if="addedTo === pl.id" class="text-theme-success font-bold">
            [✓ ADDED]
          </span>
          <span v-else class="text-[10px] text-theme-text-dim group-hover:text-white/80">
            [{{ pl.trackCount }} tracks]
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
