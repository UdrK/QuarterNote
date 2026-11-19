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
  <div class="space-y-4 font-mono select-none">
    <!-- Search Header in BBS Style -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3">
      <div class="flex items-center gap-2">
        <span class="text-[#00ffff] font-bold text-sm">■ [ QUERY RISULTATI ]</span>
        <span class="text-xs text-[#ffff00]">[{{ totalResults }} OCCORRENZE]</span>
      </div>
      <p class="text-[11px] text-[#777777] mt-0.5">
        &gt; Termine cercato: "<span class="text-[#ffff00] font-bold">{{ query }}</span>"
      </p>
    </div>

    <!-- Empty Results -->
    <div v-if="!isLoading && totalResults === 0 && query" class="border border-[#222222] p-12 text-center text-[#666666]">
      <Search class="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00ffff]" />
      <p class="text-xs">&gt; NESSUN RISULTATO TROVATO PER "{{ query }}" &lt;</p>
    </div>

    <!-- Artists Results -->
    <div v-if="results.artists.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ffff]">
        <span>■ [ ARTISTI CORRISPONDENTI ] ────────────────────</span>
        <span class="text-[#ffff00]">({{ results.artists.length }})</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <div
          v-for="artist in results.artists"
          :key="artist.id"
          @click="router.push(`/artists/${artist.id}`)"
          class="flex items-center gap-2 p-2 bg-[#070707] border border-[#222222] hover:border-[#00ffff] hover:bg-[#001726] cursor-pointer group transition-colors"
        >
          <div class="w-8 h-8 bg-black border border-[#333333] shrink-0 overflow-hidden">
            <img :src="`/api/artists/${artist.id}/image`" :alt="artist.name" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#ffff00] transition-colors">
              {{ artist.name }}
            </p>
            <p class="text-[9px] text-[#777777]">[{{ artist.albumCount }} ALBUM]</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Albums Results -->
    <div v-if="results.albums.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#ffff00]">
        <span>■ [ ALBUM CORRISPONDENTI ] ──────────────────────</span>
        <span class="text-[#ffff00]">({{ results.albums.length }})</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <div
          v-for="album in results.albums"
          :key="album.id"
          @click="router.push(`/albums/${album.id}`)"
          class="p-2 bg-[#070707] border border-[#222222] hover:border-[#ffff00] hover:bg-[#1a1700] cursor-pointer group transition-colors"
        >
          <div class="aspect-square bg-black border border-[#333333] mb-1.5 overflow-hidden">
            <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
          </div>
          <p class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#ffff00] transition-colors">
            {{ album.title }}
          </p>
          <p class="text-[10px] text-[#00ffff] truncate opacity-80">&gt; {{ album.artistName }}</p>
        </div>
      </div>
    </div>

    <!-- Tracks Results -->
    <div v-if="results.tracks.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
        <span>■ [ BRANI CORRISPONDENTI ] ─────────────────────</span>
        <span class="text-[#ffff00]">({{ results.tracks.length }})</span>
      </div>
      <div class="border border-[#222222] bg-[#070707]">
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
