<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Heart } from '@lucide/vue';
import { fetchArtists } from '../api/client';
import { isFavorite, toggleFavorite } from '../stores/favorites';
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
  return artists.value.filter((a) =>
    a.name.toLowerCase().includes(filterText.value.toLowerCase())
  );
});

async function handleToggleFavorite(e: Event, artistId: string) {
  e.stopPropagation();
  try {
    await toggleFavorite('artist', artistId);
  } catch (err) {
    console.error('Failed to toggle favorite for artist:', err);
  }
}
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
        class="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 w-48"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredArtists.length === 0" class="text-center py-20 text-slate-500">
      <Users class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessun artista trovato.</p>
    </div>

    <!-- Artists Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="artist in filteredArtists"
        :key="artist.id"
        @click="router.push(`/artists/${artist.id}`)"
        class="relative flex flex-col items-center text-center p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
      >
        <!-- Favorite heart toggle button -->
        <button
          type="button"
          @click="handleToggleFavorite($event, artist.id)"
          class="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-rose-400 backdrop-blur transition-all z-10"
          :class="[
            isFavorite('artist', artist.id)
              ? 'opacity-100 text-rose-500'
              : 'opacity-0 group-hover:opacity-100'
          ]"
          :title="isFavorite('artist', artist.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
        >
          <Heart
            class="w-3.5 h-3.5 transition-transform hover:scale-110"
            :class="{ 'fill-rose-500 text-rose-500': isFavorite('artist', artist.id) }"
          />
        </button>

        <!-- Artist Image Avatar -->
        <div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700/60 group-hover:border-sky-400/80 group-hover:scale-105 transition-all shadow-md mb-3 shrink-0">
          <img
            :src="artist.imageUrl || `/api/artists/${artist.id}/image`"
            :alt="artist.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <h3
          class="text-xs font-bold text-slate-100 truncate w-full group-hover:text-sky-400 transition-colors px-1"
          :title="artist.name"
        >
          {{ artist.name }}
        </h3>
        <p class="text-[11px] text-slate-400 mt-1">
          {{ artist.albumCount }} {{ artist.albumCount === 1 ? 'album' : 'album' }} • {{ artist.trackCount }} brani
        </p>
      </div>
    </div>
  </div>
</template>
