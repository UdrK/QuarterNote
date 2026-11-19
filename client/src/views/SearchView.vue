<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, Users, Disc3, Music2 } from '@lucide/vue';
import { searchLibrary } from '../api/client';
import TrackRow from '../components/TrackRow.vue';
import type { SearchResponse } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const results = ref<SearchResponse>({ artists: [], albums: [], tracks: [] });
const isLoading = ref(false);

const query = computed(() => (route.query.q as string) || '');

async function performSearch(q: string) {
  if (!q.trim()) {
    results.value = { artists: [], albums: [], tracks: [] };
    return;
  }
  isLoading.value = true;
  try {
    results.value = await searchLibrary(q);
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    isLoading.value = false;
  }
}

watch(query, (newQ) => {
  performSearch(newQ);
});

onMounted(() => {
  performSearch(query.value);
});

const totalResults = computed(() => 
  results.value.artists.length + results.value.albums.length + results.value.tracks.length
);
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-100">Risultati di ricerca</h1>
      <p class="text-xs text-slate-400">
        {{ totalResults }} risultati per "<span class="text-sky-400 font-medium">{{ query }}</span>"
      </p>
    </div>

    <!-- Empty Results -->
    <div v-if="!isLoading && totalResults === 0 && query" class="text-center py-20 text-slate-500">
      <Search class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessun risultato trovato per "{{ query }}".</p>
    </div>

    <!-- Artists Results -->
    <div v-if="results.artists.length > 0" class="space-y-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Users class="w-3.5 h-3.5" /> Artisti ({{ results.artists.length }})
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="artist in results.artists"
          :key="artist.id"
          @click="router.push(`/artists/${artist.id}`)"
          class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 cursor-pointer group transition-all"
        >
          <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-sky-400 shrink-0 overflow-hidden">
            <img :src="`/api/artists/${artist.id}/image`" :alt="artist.name" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
              {{ artist.name }}
            </p>
            <p class="text-[10px] text-slate-400">{{ artist.albumCount }} album</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Albums Results -->
    <div v-if="results.albums.length > 0" class="space-y-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Disc3 class="w-3.5 h-3.5" /> Album ({{ results.albums.length }})
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="album in results.albums"
          :key="album.id"
          @click="router.push(`/albums/${album.id}`)"
          class="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 cursor-pointer group transition-all"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-2 shadow">
            <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <p class="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
            {{ album.title }}
          </p>
          <p class="text-[11px] text-slate-400 truncate">{{ album.artistName }}</p>
        </div>
      </div>
    </div>

    <!-- Tracks Results -->
    <div v-if="results.tracks.length > 0" class="space-y-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Music2 class="w-3.5 h-3.5" /> Brani ({{ results.tracks.length }})
      </h2>
      <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
        <TrackRow
          v-for="(track, idx) in results.tracks"
          :key="track.id"
          :track="track"
          :index="idx"
          :playlistContext="results.tracks"
          :showAlbum="true"
        />
      </div>
    </div>
  </div>
</template>
