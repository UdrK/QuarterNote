<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Disc3 } from '@lucide/vue';
import { fetchAlbums, fetchAlbum } from '../api/client';
import { playerActions } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
import type { Album } from '@quarter-note/shared';
import { t } from '../i18n';

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
    :title="t('albums.title')" 
    :badge="t('albums.badge', { count: albums.length })" 
    hotkey="F3"
    variant="default"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Filter and Sort Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-subtle pb-2">
        <div class="text-[11px] text-theme-text-dim">
          &gt; Browse album covers (Hotkey: [F3] or [2])
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter search -->
          <div class="flex items-center flex-1 min-w-0 bg-theme-bg border border-theme-border/60 px-2 py-1 sm:py-0.5 focus-within:border-theme-highlight">
            <span class="text-theme-accent text-xs font-bold mr-1.5 shrink-0">&gt; SEARCH:</span>
            <input
              v-model="filterText"
              type="text"
              placeholder="Filter title/artist..."
              class="bg-transparent text-xs text-theme-highlight placeholder-theme-text-dim/60 focus:outline-none w-full min-w-0 sm:w-44 font-mono"
            />
            <button v-if="filterText" @click="filterText = ''" class="text-theme-text-dim hover:text-theme-danger text-xs shrink-0 cursor-pointer">
              [X]
            </button>
          </div>

          <!-- Sort selector -->
          <select
            v-model="sortBy"
            class="bg-theme-bg border border-theme-border/60 text-xs text-theme-highlight px-2 py-1 sm:py-0.5 focus:outline-none focus:border-theme-accent cursor-pointer font-mono shrink-0"
          >
            <option value="title">[SORT: TITLE]</option>
            <option value="artist">[SORT: ARTIST]</option>
            <option value="year">[SORT: YEAR]</option>
          </select>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && filteredAlbums.length === 0" class="border border-dashed border-theme-border-dim p-10 text-center text-theme-text-dim">
        <Disc3 class="w-8 h-8 mx-auto mb-2 opacity-30 text-theme-accent" />
        <p class="text-xs">&gt;&gt; NO MATCHING ALBUMS &lt;&lt;</p>
      </div>

      <!-- Albums Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          class="group flex flex-col p-2 bg-theme-panel border border-theme-border-dim hover:border-theme-accent hover:bg-theme-card transition-colors cursor-pointer"
          @click="router.push(`/albums/${album.id}`)"
        >
          <!-- Cover thumbnail -->
          <div class="relative aspect-square bg-theme-bg border border-theme-border-dim group-hover:border-theme-accent overflow-hidden mb-1.5">
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
              class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors cursor-pointer bg-theme-bg/85 md:bg-transparent px-0.5 md:px-0"
              :class="[
                isFavorite('album', album.id)
                  ? 'text-theme-danger'
                  : 'text-theme-text hover:text-theme-danger opacity-95 md:opacity-0 md:group-hover:opacity-100'
              ]"
              :title="isFavorite('album', album.id) ? t('favorites.removeFromFavorites') : 'Add to favorites'"
            >
              <span>{{ isFavorite('album', album.id) ? '[★]' : '[☆]' }}</span>
            </button>

            <!-- Quick Play Button -->
            <button
              @click.stop="playAlbum(album)"
              class="absolute bottom-1 right-1 bg-theme-highlight text-black font-extrabold px-1.5 py-0.5 text-[9px] opacity-95 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
              :title="t('favorites.playAlbum')"
            >
              <span>[▶ PLAY]</span>
            </button>
          </div>

          <!-- Info -->
          <h3 class="text-xs font-bold text-theme-text truncate group-hover:text-theme-highlight transition-colors" :title="album.title">
            {{ album.title }}
          </h3>
          <p class="text-[10px] text-theme-accent truncate mt-0.5 opacity-80" :title="album.artistName">
            &gt; {{ album.artistName }}
          </p>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
