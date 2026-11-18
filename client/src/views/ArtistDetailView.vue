<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Users, ArrowLeft, Play, Disc3 } from '@lucide/vue';
import { fetchArtist } from '../api/client';
import { playerActions } from '../stores/player';
import TrackRow from '../components/TrackRow.vue';
import type { Artist, Album, Track } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const artist = ref<Artist | null>(null);
const albums = ref<Album[]>([]);
const tracks = ref<Track[]>([]);
const isLoading = ref(true);

const artistId = computed(() => route.params.id as string);

onMounted(async () => {
  try {
    const data = await fetchArtist(artistId.value);
    artist.value = data.artist;
    albums.value = data.albums;
    tracks.value = data.tracks;
  } catch (err) {
    console.error('Failed to load artist:', err);
  } finally {
    isLoading.value = false;
  }
});

function playAll() {
  if (tracks.value.length > 0) {
    playerActions.playTrack(tracks.value[0], tracks.value);
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <button
      @click="router.back()"
      class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
    >
      <ArrowLeft class="w-3.5 h-3.5" /> Torna indietro
    </button>

    <!-- Artist Banner -->
    <div v-if="artist" class="flex items-center gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 shadow-xl backdrop-blur">
      <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shadow-xl shrink-0">
        <Users class="w-10 h-10" />
      </div>

      <div class="space-y-2 min-w-0 flex-1">
        <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">Artista</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight truncate">
          {{ artist.name }}
        </h1>
        <p class="text-xs text-slate-400">
          {{ albums.length }} album • {{ tracks.length }} brani
        </p>

        <button
          @click="playAll"
          class="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 hover:scale-105 transition-all mt-2"
        >
          <Play class="w-4 h-4 fill-current translate-x-0.5" />
          <span>Riproduci tutti i brani</span>
        </button>
      </div>
    </div>

    <!-- Albums section -->
    <div v-if="albums.length > 0" class="space-y-3">
      <h2 class="text-sm font-bold text-slate-200 tracking-wide">Album</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="alb in albums"
          :key="alb.id"
          @click="router.push(`/albums/${alb.id}`)"
          class="group p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-2 shadow">
            <img :src="alb.coverUrl" :alt="alb.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <p class="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
            {{ alb.title }}
          </p>
          <p class="text-[11px] text-slate-400">{{ alb.year || '' }}</p>
        </div>
      </div>
    </div>

    <!-- Tracks section -->
    <div v-if="tracks.length > 0" class="space-y-3">
      <h2 class="text-sm font-bold text-slate-200 tracking-wide">Tutti i Brani</h2>
      <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
        <TrackRow
          v-for="(track, idx) in tracks"
          :key="track.id"
          :track="track"
          :index="idx"
          :playlistContext="tracks"
          :showAlbum="true"
        />
      </div>
    </div>
  </div>
</template>
