<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Disc3 } from '@lucide/vue';
import { fetchAlbums, fetchAlbum } from '../api/client';
import { playerActions } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
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
  <TuiWindow 
    title="ALBUMS CATALOG" 
    :badge="`${albums.length} CATALOGED ALBUMS`" 
    hotkey="F3"
    variant="yellow"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Filter and Sort Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2a2a00] pb-2">
        <div class="text-[11px] text-[#888800]">
          &gt; Browse album covers (Hotkey: [F3] or [2])
        </div>

        <div class="flex items-center gap-2">
          <!-- Filter search -->
          <div class="flex items-center bg-black border border-[#ffff00]/60 px-2 py-0.5 focus-within:border-[#00ffff]">
            <span class="text-[#ffff00] text-xs font-bold mr-1.5">&gt; SEARCH:</span>
            <input
              v-model="filterText"
              type="text"
              placeholder="Filter title/artist..."
              class="bg-transparent text-xs text-[#ffff00] placeholder-[#555500] focus:outline-none w-36 sm:w-44 font-mono"
            />
            <button v-if="filterText" @click="filterText = ''" class="text-[#888888] hover:text-[#ff3366] text-xs cursor-pointer">
              [X]
            </button>
          </div>

          <!-- Sort selector -->
          <select
            v-model="sortBy"
            class="bg-black border border-[#ffff00]/60 text-xs text-[#ffff00] px-2 py-0.5 focus:outline-none focus:border-[#00ffff] cursor-pointer font-mono"
          >
            <option value="title">[SORT: TITLE]</option>
            <option value="artist">[SORT: ARTIST]</option>
            <option value="year">[SORT: YEAR]</option>
          </select>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && filteredAlbums.length === 0" class="border border-dashed border-[#333300] p-10 text-center text-[#666600]">
        <Disc3 class="w-8 h-8 mx-auto mb-2 opacity-30 text-[#ffff00]" />
        <p class="text-xs">&gt;&gt; NO MATCHING ALBUMS &lt;&lt;</p>
      </div>

      <!-- Albums Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          class="group flex flex-col p-2 bg-[#090800] border border-[#2a2a00] hover:border-[#ffff00] hover:bg-[#1a1700] transition-colors cursor-pointer"
          @click="router.push(`/albums/${album.id}`)"
        >
          <!-- Cover thumbnail -->
          <div class="relative aspect-square bg-black border border-[#333300] group-hover:border-[#ffff00] overflow-hidden mb-1.5">
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
              class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors cursor-pointer"
              :class="[
                isFavorite('album', album.id)
                  ? 'text-[#ff3366]'
                  : 'text-[#444400] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
              ]"
              :title="isFavorite('album', album.id) ? 'Remove from favorites' : 'Add to favorites'"
            >
              <span>{{ isFavorite('album', album.id) ? '[★]' : '[☆]' }}</span>
            </button>

            <!-- Quick Play Button -->
            <button
              @click.stop="playAlbum(album)"
              class="absolute bottom-1 right-1 bg-[#ffff00] text-black font-extrabold px-1.5 py-0.5 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Play album"
            >
              <span>[▶ PLAY]</span>
            </button>
          </div>

          <!-- Info -->
          <h3 class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#ffff00] transition-colors" :title="album.title">
            {{ album.title }}
          </h3>
          <p class="text-[10px] text-[#00ffff] truncate mt-0.5 opacity-80" :title="album.artistName">
            &gt; {{ album.artistName }}
          </p>
          <span v-if="album.year" class="text-[9px] text-[#888800] mt-0.5">
            YEAR: {{ album.year }}
          </span>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
