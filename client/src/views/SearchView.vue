<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from '@lucide/vue';
import { searchLibrary } from '../api/client';
import TrackRow from '../components/TrackRow.vue';
import TuiWindow from '../components/TuiWindow.vue';
import type { SearchResponse } from '@quarter-note/shared';
import { t } from '../i18n';

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
  <TuiWindow 
    :title="t('search.title')" 
    :badge="`${totalResults} MATCHES`" 
    variant="default"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Search Summary -->
      <div class="border-b border-theme-border-subtle pb-2 text-xs">
        <span class="text-theme-text-dim">&gt; Search query: </span>
        <span class="text-theme-highlight font-bold">"{{ query }}"</span>
      </div>

      <!-- Empty Results -->
      <div v-if="!isLoading && totalResults === 0 && query" class="border border-dashed border-theme-border-dim p-10 text-center text-theme-text-dim">
        <Search class="w-8 h-8 mx-auto mb-2 opacity-30 text-theme-accent" />
        <p class="text-xs">&gt;&gt; {{ t('search.noResults', { query }) }} &lt;&lt;</p>
      </div>

      <!-- Artists Results -->
      <div v-if="results.artists.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-accent">
          <span class="truncate">┌──[ {{ t('search.artists') }} ]────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ results.artists.length }})─┐</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <div
            v-for="artist in results.artists"
            :key="artist.id"
            @click="router.push(`/artists/${artist.id}`)"
            class="flex items-center gap-2 p-1.5 bg-theme-panel border border-theme-border-dim hover:border-theme-accent hover:bg-theme-card cursor-pointer group transition-colors"
          >
            <div class="w-8 h-8 bg-theme-bg border border-theme-border-dim shrink-0 overflow-hidden">
              <img :src="`/api/artists/${artist.id}/image`" :alt="artist.name" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-theme-text truncate group-hover:text-theme-highlight transition-colors">
                {{ artist.name }}
              </p>
              <p class="text-[9px] text-theme-text-dim">{{ t('favorites.albumsCount', { count: artist.albumCount }) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Albums Results -->
      <div v-if="results.albums.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-highlight">
          <span class="truncate">┌──[ {{ t('search.albums') }} ]──────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ results.albums.length }})─┐</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <div
            v-for="album in results.albums"
            :key="album.id"
            @click="router.push(`/albums/${album.id}`)"
            class="p-1.5 bg-theme-panel border border-theme-border-dim hover:border-theme-highlight hover:bg-theme-card cursor-pointer group transition-colors"
          >
            <div class="aspect-square bg-theme-bg border border-theme-border-dim mb-1 overflow-hidden">
              <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
            </div>
            <p class="text-xs font-bold text-theme-text truncate group-hover:text-theme-highlight transition-colors">
              {{ album.title }}
            </p>
            <p class="text-[9px] text-theme-accent truncate opacity-80">&gt; {{ album.artistName }}</p>
          </div>
        </div>
      </div>

      <!-- Tracks Results -->
      <div v-if="results.tracks.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-success">
          <span class="truncate">┌──[ {{ t('search.tracks') }} ]─────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ results.tracks.length }})─┐</span>
        </div>
        <div class="border border-theme-border-dim bg-theme-panel">
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
  </TuiWindow>
</template>
