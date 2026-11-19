<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users } from '@lucide/vue';
import { fetchArtists } from '../api/client';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
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
    console.error('Failed to toggle favorite:', err);
  }
}
</script>

<template>
  <TuiWindow 
    title="DIRECTORY ARTISTI" 
    :badge="`${artists.length} REGISTRATI`" 
    hotkey="F2"
    variant="cyan"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Top Action & Filter Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2936] pb-2">
        <div class="text-[11px] text-[#6688aa]">
          &gt; Seleziona un artista per sfogliare la discografia (Tasto rapido: [F2] o [1])
        </div>

        <div class="flex items-center bg-black border border-[#00ffff]/60 px-2 py-0.5 focus-within:border-[#ffff00]">
          <span class="text-[#00ffff] text-xs font-bold mr-1.5">&gt; FILTRO:</span>
          <input
            v-model="filterText"
            type="text"
            placeholder="Nome artista..."
            class="bg-transparent text-xs text-[#ffff00] placeholder-[#445566] focus:outline-none w-36 sm:w-48 font-mono"
          />
          <button v-if="filterText" @click="filterText = ''" class="text-[#777777] hover:text-[#ff3366] text-xs cursor-pointer">
            [X]
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && filteredArtists.length === 0" class="border border-dashed border-[#223d54] p-10 text-center text-[#556677]">
        <Users class="w-8 h-8 mx-auto mb-2 opacity-30 text-[#00ffff]" />
        <p class="text-xs">&gt;&gt; NESSUN ARTISTA CORRISPONDENTE &lt;&lt;</p>
      </div>

      <!-- Artists Grid in Curses Box Style -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div
          v-for="artist in filteredArtists"
          :key="artist.id"
          @click="router.push(`/artists/${artist.id}`)"
          class="relative flex flex-col items-center text-center p-2.5 border border-[#1a2b3c] bg-[#04080e] hover:border-[#00ffff] hover:bg-[#001f33] transition-colors cursor-pointer group"
        >
          <!-- Favorite toggle -->
          <button
            type="button"
            @click="handleToggleFavorite($event, artist.id)"
            class="absolute top-1.5 right-1.5 text-xs font-bold z-10 transition-colors cursor-pointer"
            :class="[
              isFavorite('artist', artist.id)
                ? 'text-[#ff3366]'
                : 'text-[#334455] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
            ]"
            :title="isFavorite('artist', artist.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
          >
            <span>{{ isFavorite('artist', artist.id) ? '[★]' : '[☆]' }}</span>
          </button>

          <!-- Artist Image Frame with ASCII border -->
          <div class="w-20 h-20 sm:w-24 sm:h-24 bg-black border border-[#223d54] group-hover:border-[#00ffff] overflow-hidden mb-2 relative">
            <img
              :src="artist.imageUrl || `/api/artists/${artist.id}/image`"
              :alt="artist.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute bottom-0 right-0 bg-black text-[7px] text-[#00ffff] px-0.5 border-t border-l border-[#223d54]">
              IMG
            </div>
          </div>

          <h3
            class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate w-full transition-colors"
            :title="artist.name"
          >
            {{ artist.name }}
          </h3>
          <p class="text-[10px] text-[#00ffff]/80 mt-0.5">
            [{{ artist.albumCount }} ALBUM]
          </p>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
