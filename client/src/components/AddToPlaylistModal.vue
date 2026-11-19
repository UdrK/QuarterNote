<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { X, Plus, Check } from '@lucide/vue';
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
    <div class="bg-black border-2 border-[#00ffff] w-full max-w-sm shadow-[0_0_20px_rgba(0,255,255,0.2)] overflow-hidden select-none">
      <!-- Header -->
      <div class="px-4 py-2 border-b border-[#222222] bg-[#0a0a0a] flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-[#00ffff]">■ [ ADD TO PLAYLIST ]</h3>
          <p class="text-[10px] text-[#888888] truncate max-w-[240px]">&gt; {{ track.title }}</p>
        </div>
        <button @click="emit('close')" class="bbs-btn py-0.5 px-1.5 text-xs border-[#333333]">
          [X]
        </button>
      </div>

      <!-- New playlist form -->
      <div class="p-3 border-b border-[#222222] bg-[#060606]">
        <form @submit.prevent="handleCreateAndAdd" class="flex items-center gap-2">
          <input
            v-model="newName"
            type="text"
            placeholder="New playlist name..."
            class="flex-1 bg-black text-xs text-[#ffff00] px-2.5 py-1.5 border border-[#333333] focus:outline-none focus:border-[#00ffff]"
          />
          <button
            type="submit"
            :disabled="!newName.trim() || isCreating"
            class="bbs-btn bbs-btn-yellow py-1.5 px-3 text-xs"
          >
            [+ CREATE]
          </button>
        </form>
      </div>

      <!-- Playlists list -->
      <div class="max-h-60 overflow-y-auto p-2 space-y-1">
        <div v-if="playlists.length === 0" class="text-center py-6 text-xs text-[#666666] italic">
          No playlists created.
        </div>

        <button
          v-for="pl in playlists"
          :key="pl.id"
          @click="handleAddTo(pl.id)"
          class="w-full flex items-center justify-between px-2.5 py-2 text-xs text-[#cccccc] border border-[#1a1a1a] hover:bg-[#002b4d] hover:border-[#00ffff] hover:text-[#ffff00] transition-colors group"
        >
          <span class="truncate">&gt; {{ pl.name }}</span>
          <span v-if="addedTo === pl.id" class="text-[#00ff66] font-bold">
            [✓ ADDED]
          </span>
          <span v-else class="text-[10px] text-[#777777] group-hover:text-[#00ffff]">
            [{{ pl.trackCount }} tracks]
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
