<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Play, Disc3, Heart } from '@lucide/vue';
import { fetchAlbums, fetchAlbum } from '../api/client';
import { playerActions } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
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
  <div class="space-y-4 font-mono select-none">
    <!-- View Header & Controls -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[#00ffff] font-bold text-sm">■ [ CATALOGO DISCOGRAFICO ]</span>
          <span class="text-xs text-[#ffff00]">[{{ albums.length }} ALBUM]</span>
        </div>
        <p class="text-[11px] text-[#777777] mt-0.5">&gt; Naviga tra gli album catalogati nel server</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Filter search -->
        <div class="flex items-center bg-black border border-[#333333] px-2 py-1 focus-within:border-[#00ffff]">
          <span class="text-[#00ffff] text-xs font-bold mr-1">&gt;</span>
          <input
            v-model="filterText"
            type="text"
            placeholder="Filtra album/artista..."
            class="bg-transparent text-xs text-[#ffff00] placeholder-[#555555] focus:outline-none w-36 sm:w-44"
          />
        </div>

        <!-- Sort selector -->
        <select
          v-model="sortBy"
          class="bg-black border border-[#333333] text-xs text-[#00ffff] px-2 py-1 focus:outline-none focus:border-[#00ffff] cursor-pointer"
        >
          <option value="title">[ORD: TITOLO]</option>
          <option value="artist">[ORD: ARTISTA]</option>
          <option value="year">[ORD: ANNO]</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredAlbums.length === 0" class="border border-[#222222] p-12 text-center text-[#666666]">
      <Disc3 class="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00ffff]" />
      <p class="text-xs">&gt; NESSUN ALBUM TROVATO &lt;</p>
      <p class="text-[10px] text-[#555555] mt-1">Usa [RISCANSIONA] nel menu laterale per importare la musica.</p>
    </div>

    <!-- Albums Grid in BBS Style -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <div
        v-for="album in filteredAlbums"
        :key="album.id"
        class="group flex flex-col p-2 bg-[#070707] border border-[#222222] hover:border-[#00ffff] hover:bg-[#001726] transition-colors cursor-pointer"
        @click="router.push(`/albums/${album.id}`)"
      >
        <!-- Cover thumbnail -->
        <div class="relative aspect-square bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-2">
          <img
            :src="album.coverUrl"
            :alt="album.title"
            loading="lazy"
            class="w-full h-full object-cover"
          />

          <!-- Favorite Button Overlay -->
          <button
            type="button"
            @click.stop="toggleFavorite('album', album.id)"
            class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors"
            :class="[
              isFavorite('album', album.id)
                ? 'text-[#ff3366]'
                : 'text-[#444444] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
            ]"
            :title="isFavorite('album', album.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
          >
            <span>{{ isFavorite('album', album.id) ? '[★]' : '[☆]' }}</span>
          </button>

          <!-- Quick Play Overlay Button -->
          <button
            @click.stop="playAlbum(album)"
            class="absolute bottom-1 right-1 bbs-btn bbs-btn-green py-0.5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Riproduci album"
          >
            <span>[▶ PLAY]</span>
          </button>
        </div>

        <!-- Info -->
        <h3 class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#ffff00] transition-colors" :title="album.title">
          {{ album.title }}
        </h3>
        <p class="text-[11px] text-[#00ffff] truncate mt-0.5 opacity-80" :title="album.artistName">
          &gt; {{ album.artistName }}
        </p>
        <span v-if="album.year" class="text-[10px] text-[#777777] mt-1">
          ANNO: {{ album.year }}
        </span>
      </div>
    </div>
  </div>
</template>
