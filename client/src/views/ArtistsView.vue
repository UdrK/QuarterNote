<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Music2 } from '@lucide/vue';
import { fetchArtists } from '../api/client';
import type { Artist } from '@quarter-note/shared';

const router = useRouter();
const artists = ref<Artist[]>([]);
const filterText = ref('');
const isLoading = ref(true);

onMounted(async () => {
  try {
    artists.value = await fetchArtists();
  } catch (err) {
    console.error('Failed to load artists:', err);
  } finally {
    isLoading.value = false;
  }
});

const filteredArtists = computed(() => {
  return artists.value.filter(a =>
    a.name.toLowerCase().includes(filterText.value.toLowerCase())
  );
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Artisti</h1>
        <p class="text-xs text-slate-400">{{ artists.length }} artisti in libreria</p>
      </div>

      <input
        v-model="filterText"
        type="text"
        placeholder="Filtra artisti..."
        class="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 w-44"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredArtists.length === 0" class="text-center py-20 text-slate-500">
      <Users class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessun artista trovato.</p>
    </div>

    <!-- Artists Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="artist in filteredArtists"
        :key="artist.id"
        @click="router.push(`/artists/${artist.id}`)"
        class="flex flex-col items-center text-center p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer group"
      >
        <div class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-sky-400 group-hover:scale-105 transition-all shadow-inner mb-3">
          <Users class="w-8 h-8" />
        </div>

        <h3 class="text-xs font-semibold text-slate-100 truncate w-full group-hover:text-sky-400 transition-colors" :title="artist.name">
          {{ artist.name }}
        </h3>
        <p class="text-[11px] text-slate-400 mt-1">
          {{ artist.albumCount }} {{ artist.albumCount === 1 ? 'album' : 'album' }} • {{ artist.trackCount }} brani
        </p>
      </div>
    </div>
  </div>
</template>
