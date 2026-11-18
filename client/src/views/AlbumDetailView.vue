<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Play, Shuffle, ArrowLeft } from '@lucide/vue';
import { fetchAlbum } from '../api/client';
import { playerActions, formatTime } from '../stores/player';
import TrackRow from '../components/TrackRow.vue';
import type { Album, Track } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const album = ref<Album | null>(null);
const tracks = ref<Track[]>([]);
const isLoading = ref(true);

const albumId = computed(() => route.params.id as string);

onMounted(async () => {
  try {
    const data = await fetchAlbum(albumId.value);
    album.value = data.album;
    tracks.value = data.tracks;
  } catch (err) {
    console.error('Failed to load album:', err);
  } finally {
    isLoading.value = false;
  }
});

function playAll() {
  if (tracks.value.length > 0) {
    playerActions.playTrack(tracks.value[0], tracks.value);
  }
}

function playShuffled() {
  if (tracks.value.length > 0) {
    const shuffled = [...tracks.value].sort(() => Math.random() - 0.5);
    playerActions.playTrack(shuffled[0], shuffled);
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back button -->
    <button
      @click="router.back()"
      class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
    >
      <ArrowLeft class="w-3.5 h-3.5" /> Torna indietro
    </button>

    <!-- Album Hero Card -->
    <div v-if="album" class="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 shadow-xl backdrop-blur">
      <div class="w-44 h-44 rounded-xl overflow-hidden bg-slate-800 shadow-2xl shrink-0">
        <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
      </div>

      <div class="space-y-3 min-w-0 flex-1 text-center sm:text-left">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">Album</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 truncate">
            {{ album.title }}
          </h1>
          <p 
            @click="router.push(`/artists/${album.artistId}`)" 
            class="text-sm font-semibold text-slate-300 hover:text-sky-400 cursor-pointer transition-colors mt-1"
          >
            {{ album.artistName }}
          </p>
          <div class="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 mt-2">
            <span v-if="album.year">{{ album.year }}</span>
            <span v-if="album.year">•</span>
            <span>{{ tracks.length }} brani</span>
            <span>•</span>
            <span>{{ formatTime(album.duration) }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center justify-center sm:justify-start gap-3 pt-2">
          <button
            @click="playAll"
            class="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 hover:scale-105 transition-all"
          >
            <Play class="w-4 h-4 fill-current translate-x-0.5" />
            <span>Riproduci</span>
          </button>
          <button
            @click="playShuffled"
            class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700/60 hover:scale-105 transition-all"
          >
            <Shuffle class="w-3.5 h-3.5" />
            <span>Casuale</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tracks List -->
    <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
      <TrackRow
        v-for="(track, idx) in tracks"
        :key="track.id"
        :track="track"
        :index="idx"
        :playlistContext="tracks"
      />
    </div>
  </div>
</template>
