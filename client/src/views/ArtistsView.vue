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
  <div class="space-y-4 font-mono select-none">
    <!-- BBS Header Banner -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[#00ffff] font-bold text-sm">■ [ DIRECTORY ARTISTI ]</span>
          <span class="text-xs text-[#ffff00]">[{{ artists.length }} ARTISTI]</span>
        </div>
        <p class="text-[11px] text-[#777777] mt-0.5">&gt; Seleziona un artista per sfogliare gli album disponibili</p>
      </div>

      <div class="flex items-center bg-black border border-[#333333] px-2 py-1 focus-within:border-[#00ffff]">
        <span class="text-[#00ffff] text-xs font-bold mr-1">&gt;</span>
        <input
          v-model="filterText"
          type="text"
          placeholder="Filtra per nome..."
          class="bg-transparent text-xs text-[#ffff00] placeholder-[#555555] focus:outline-none w-36 sm:w-48"
        />
        <button v-if="filterText" @click="filterText = ''" class="text-[#777777] hover:text-[#ff3366] text-xs">
          [X]
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredArtists.length === 0" class="border border-[#222222] p-12 text-center text-[#666666]">
      <Users class="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00ffff]" />
      <p class="text-xs">&gt; NESSUN ARTISTA TROVATO &lt;</p>
    </div>

    <!-- Artists Grid in BBS Style -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="artist in filteredArtists"
        :key="artist.id"
        @click="router.push(`/artists/${artist.id}`)"
        class="relative flex flex-col items-center text-center p-3 border border-[#222222] bg-[#070707] hover:border-[#00ffff] hover:bg-[#001726] transition-colors cursor-pointer group"
      >
        <!-- Favorite toggle button -->
        <button
          type="button"
          @click="handleToggleFavorite($event, artist.id)"
          class="absolute top-2 right-2 text-xs font-bold z-10 transition-colors"
          :class="[
            isFavorite('artist', artist.id)
              ? 'text-[#ff3366]'
              : 'text-[#444444] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
          ]"
          :title="isFavorite('artist', artist.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
        >
          <span>{{ isFavorite('artist', artist.id) ? '[★]' : '[☆]' }}</span>
        </button>

        <!-- Artist Image Frame -->
        <div class="w-24 h-24 sm:w-28 sm:h-28 bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-2.5 relative">
          <img
            :src="artist.imageUrl || `/api/artists/${artist.id}/image`"
            :alt="artist.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div class="absolute bottom-0 right-0 bg-black/80 text-[8px] text-[#00ffff] px-0.5 leading-none">
            IMG
          </div>
        </div>

        <h3
          class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate w-full transition-colors"
          :title="artist.name"
        >
          {{ artist.name }}
        </h3>
        <p class="text-[10px] text-[#00ffff]/80 mt-1">
          [{{ artist.albumCount }} ALBUM]
        </p>
      </div>
    </div>
  </div>
</template>
