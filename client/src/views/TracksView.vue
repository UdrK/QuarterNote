<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Music2, Play, Shuffle } from '@lucide/vue';
import { fetchTracks } from '../api/client';
import { playerActions } from '../stores/player';
import TrackRow from '../components/TrackRow.vue';
import type { Track } from '@quarter-note/shared';

const tracks = ref<Track[]>([]);
const filterText = ref('');
const sortBy = ref<'title' | 'artist' | 'album' | 'duration'>('title');
const isLoading = ref(true);

onMounted(async () => {
  try {
    tracks.value = await fetchTracks();
  } catch (err) {
    console.error('Failed to load tracks:', err);
  } finally {
    isLoading.value = false;
  }
});

const filteredTracks = computed(() => {
  let list = tracks.value.filter(t =>
    t.title.toLowerCase().includes(filterText.value.toLowerCase()) ||
    t.artistName.toLowerCase().includes(filterText.value.toLowerCase()) ||
    t.albumTitle.toLowerCase().includes(filterText.value.toLowerCase())
  );

  list.sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title);
    if (sortBy.value === 'artist') return a.artistName.localeCompare(b.artistName);
    if (sortBy.value === 'album') return a.albumTitle.localeCompare(b.albumTitle);
    if (sortBy.value === 'duration') return b.duration - a.duration;
    return 0;
  });

  return list;
});

function playAll() {
  if (filteredTracks.value.length > 0) {
    playerActions.playTrack(filteredTracks.value[0], filteredTracks.value);
  }
}

function playShuffled() {
  if (filteredTracks.value.length > 0) {
    const shuffled = [...filteredTracks.value].sort(() => Math.random() - 0.5);
    playerActions.playTrack(shuffled[0], shuffled);
  }
}
</script>

<template>
  <div class="p-6 space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Brani</h1>
        <p class="text-xs text-slate-400">{{ tracks.length }} brani totali</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="playAll"
          :disabled="filteredTracks.length === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>Riproduci</span>
        </button>

        <button
          @click="playShuffled"
          :disabled="filteredTracks.length === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
        >
          <Shuffle class="w-3.5 h-3.5" />
          <span>Casuale</span>
        </button>

        <input
          v-model="filterText"
          type="text"
          placeholder="Cerca nei brani..."
          class="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 w-44"
        />

        <select
          v-model="sortBy"
          class="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="title">Titolo</option>
          <option value="artist">Artista</option>
          <option value="album">Album</option>
          <option value="duration">Durata</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredTracks.length === 0" class="text-center py-20 text-slate-500">
      <Music2 class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessun brano trovato.</p>
    </div>

    <!-- Tracks Table -->
    <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
      <TrackRow
        v-for="(track, idx) in filteredTracks"
        :key="track.id"
        :track="track"
        :index="idx"
        :playlistContext="filteredTracks"
        :showAlbum="true"
      />
    </div>
  </div>
</template>
