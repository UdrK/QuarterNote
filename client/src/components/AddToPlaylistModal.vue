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
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-100">Aggiungi a playlist</h3>
          <p class="text-[11px] text-slate-400 truncate max-w-[240px]">{{ track.title }} - {{ track.artistName }}</p>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-100 p-1 rounded-md">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- New playlist form -->
      <div class="p-3 border-b border-slate-800/60 bg-slate-950/40">
        <form @submit.prevent="handleCreateAndAdd" class="flex items-center gap-2">
          <input
            v-model="newName"
            type="text"
            placeholder="Nuova playlist..."
            class="flex-1 bg-slate-800 text-xs text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            :disabled="!newName.trim() || isCreating"
            class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg disabled:opacity-50 transition-colors"
          >
            Crea
          </button>
        </form>
      </div>

      <!-- Playlists list -->
      <div class="max-h-60 overflow-y-auto p-2 space-y-1">
        <div v-if="playlists.length === 0" class="text-center py-6 text-xs text-slate-500 italic">
          Nessuna playlist creata.
        </div>

        <button
          v-for="pl in playlists"
          :key="pl.id"
          @click="handleAddTo(pl.id)"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors group"
        >
          <span class="truncate">{{ pl.name }}</span>
          <span v-if="addedTo === pl.id" class="text-sky-400 flex items-center gap-1 font-semibold">
            <Check class="w-3.5 h-3.5" /> Aggiunto!
          </span>
          <span v-else class="text-[11px] text-slate-500 group-hover:text-slate-400">
            {{ pl.trackCount }} brani
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
