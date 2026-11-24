<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users } from '@lucide/vue';
import { fetchArtists } from '../api/client';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
import type { Artist } from '@quarter-note/shared';
import { t } from '../i18n';

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
    :title="t('artists.title')" 
    :badge="t('artists.badge', { count: artists.length })" 
    hotkey="F2"
    variant="default"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Top Action & Filter Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-subtle pb-2">
        <div class="text-[11px] text-theme-text-dim">
          &gt; Select an artist to browse their discography (Hotkey: [F2] or [1])
        </div>

        <div class="flex items-center bg-theme-bg border border-theme-border/60 px-2 py-0.5 focus-within:border-theme-highlight">
          <span class="text-theme-accent text-xs font-bold mr-1.5">&gt; FILTER:</span>
          <input
            v-model="filterText"
            type="text"
            placeholder="Artist name..."
            class="bg-transparent text-xs text-theme-highlight placeholder-theme-text-dim/60 focus:outline-none w-36 sm:w-48 font-mono"
          />
          <button v-if="filterText" @click="filterText = ''" class="text-theme-text-dim hover:text-theme-danger text-xs cursor-pointer">
            [X]
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && filteredArtists.length === 0" class="border border-dashed border-theme-border-dim p-10 text-center text-theme-text-dim">
        <Users class="w-8 h-8 mx-auto mb-2 opacity-30 text-theme-accent" />
        <p class="text-xs">&gt;&gt; NO MATCHING ARTISTS &lt;&lt;</p>
      </div>

      <!-- Artists Grid in Curses Box Style -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div
          v-for="artist in filteredArtists"
          :key="artist.id"
          @click="router.push(`/artists/${artist.id}`)"
          class="relative flex flex-col items-center text-center p-2.5 border border-theme-border-dim bg-theme-panel hover:border-theme-accent hover:bg-theme-card transition-colors cursor-pointer group"
        >
          <!-- Favorite toggle -->
          <button
            type="button"
            @click="handleToggleFavorite($event, artist.id)"
            class="absolute top-1.5 right-1.5 text-xs font-bold z-10 transition-colors cursor-pointer"
            :class="[
              isFavorite('artist', artist.id)
                ? 'text-theme-danger'
                : 'text-theme-border-dim hover:text-theme-danger opacity-0 group-hover:opacity-100'
            ]"
            :title="isFavorite('artist', artist.id) ? t('favorites.removeFromFavorites') : 'Add to favorites'"
          >
            <span>{{ isFavorite('artist', artist.id) ? '[★]' : '[☆]' }}</span>
          </button>

          <!-- Artist Image Frame with ASCII border -->
          <div class="w-20 h-20 sm:w-24 sm:h-24 bg-theme-bg border border-theme-border-dim group-hover:border-theme-accent overflow-hidden mb-2 relative">
            <img
              :src="artist.imageUrl || `/api/artists/${artist.id}/image`"
              :alt="artist.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute bottom-0 right-0 bg-theme-bg text-[7px] text-theme-accent px-0.5 border-t border-l border-theme-border-dim">
              IMG
            </div>
          </div>

          <h3
            class="text-xs font-bold text-theme-text group-hover:text-theme-highlight truncate w-full transition-colors"
            :title="artist.name"
          >
            {{ artist.name }}
          </h3>
          <p class="text-[10px] text-theme-accent opacity-80 mt-0.5">
            {{ t('favorites.albumsCount', { count: artist.albumCount }) }}
          </p>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
