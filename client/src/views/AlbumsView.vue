<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Play, Disc3 } from '@lucide/vue';
import { fetchAlbums, fetchAlbum } from '../api/client';
import { playerActions } from '../stores/player';
import type { Album } from '@quarter-note/shared';

const router = useRouter();
const albums = ref<Album[]>([]);
const filterText = ref('');
const sortBy = ref<'title' | 'artist' | 'year'>('title');
const isLoading = ref(true);

onMounted(async () => {
  try {
    albums.value = await fetchAlbums();
  } catch (err) {
    console.error('Failed to load albums:', err);
  } finally {
    isLoading.value = false;
  }
});

const filteredAlbums = computed(() => {
  let list = albums.value.filter(a => 
    a.title.toLowerCase().includes(filterText.value.toLowerCase()) ||
    a.artistName.toLowerCase().includes(filterText.value.toLowerCase())
  );

  list.sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title);
    if (sortBy.value === 'artist') return a.artistName.localeCompare(b.artistName);
    if (sortBy.value === 'year') return (b.year || 0) - (a.year || 0);
    return 0;
  });

  return list;
});

async function playAlbum(album: Album) {
  try {
    const { tracks } = await fetchAlbum(album.id);
    if (tracks.length > 0) {
      playerActions.playTrack(tracks[0], tracks);
    }
  } catch (err) {
    console.error('Failed to play album:', err);
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- View Header & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Album</h1>
        <p class="text-xs text-slate-400">{{ albums.length }} album in libreria</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Filter search -->
        <input
          v-model="filterText"
          type="text"
          placeholder="Filtra album..."
          class="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 w-44"
        />

        <!-- Sort selector -->
        <select
          v-model="sortBy"
          class="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="title">Titolo</option>
          <option value="artist">Artista</option>
          <option value="year">Anno</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div v-for="n in 12" :key="n" class="animate-pulse space-y-2">
        <div class="bg-slate-800/60 aspect-square rounded-xl" />
        <div class="h-3 bg-slate-800/80 rounded w-3/4" />
        <div class="h-2.5 bg-slate-800/50 rounded w-1/2" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAlbums.length === 0" class="text-center py-20 text-slate-500">
      <Disc3 class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessun album trovato.</p>
      <p class="text-xs text-slate-600 mt-1">Premi "Riscansiona Libreria" nella barra laterale per caricare i tuoi brani.</p>
    </div>

    <!-- Albums Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div
        v-for="album in filteredAlbums"
        :key="album.id"
        class="group flex flex-col p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer"
        @click="router.push(`/albums/${album.id}`)"
      >
        <!-- Cover thumbnail -->
        <div class="relative aspect-square rounded-lg overflow-hidden bg-slate-800 mb-2.5 shadow-md">
          <img
            :src="album.coverUrl"
            :alt="album.title"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <!-- Quick Play Overlay Button -->
          <button
            @click.stop="playAlbum(album)"
            class="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
            title="Riproduci album"
          >
            <Play class="w-4 h-4 fill-current translate-x-0.5" />
          </button>
        </div>

        <!-- Info -->
        <h3 class="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors" :title="album.title">
          {{ album.title }}
        </h3>
        <p class="text-[11px] text-slate-400 truncate mt-0.5" :title="album.artistName">
          {{ album.artistName }}
        </p>
        <span v-if="album.year" class="text-[10px] text-slate-500 mt-1">
          {{ album.year }}
        </span>
      </div>
    </div>
  </div>
</template>
