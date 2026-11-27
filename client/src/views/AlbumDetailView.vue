<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchAlbum } from '../api/client';
import { playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
import TuiWindow from '../components/TuiWindow.vue';
import type { Album, Track } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const album = ref<Album | null>(null);
const tracks = ref<Track[]>([]);
const isLoading = ref(true);

const albumId = computed(() => route.params.id as string);

onMounted(async () => {
  try {
    const data = await fetchAlbum(albumId.value);
    album.value = data.album;
    tracks.value = data.tracks;
  } catch (err) {
    console.error('Failed to load album:', err);
  } finally {
    isLoading.value = false;
  }
});

function playAll() {
  if (tracks.value.length > 0) {
    playerActions.playTrack(tracks.value[0], tracks.value);
  }
}

function playShuffled() {
  if (tracks.value.length > 0) {
    const shuffled = [...tracks.value].sort(() => Math.random() - 0.5);
    playerActions.playTrack(shuffled[0], shuffled);
  }
}
</script>

<template>
  <TuiWindow 
    :title="album ? `ALBUM: ${album.title}` : 'LOADING...'" 
    :badge="album ? `${tracks.length} TRACKS / ${formatTime(album.duration)}` : ''"
    variant="default"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Breadcrumb -->
      <div class="flex flex-wrap items-center gap-2 text-xs border-b border-theme-border-subtle pb-2">
        <button
          @click="router.back()"
          class="bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <span>[&lt; BACK]</span>
        </button>
        <span class="hidden sm:inline text-theme-text-dim">&gt; CATALOG &gt; ALBUMS &gt;</span>
        <span class="text-theme-accent font-bold truncate" v-if="album">[{{ album.title }}]</span>
      </div>

      <!-- Album Hero Card in Curses Box -->
      <div v-if="album" class="border border-theme-border-dim bg-theme-panel p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div class="w-32 h-32 sm:w-36 sm:h-36 bg-black border-2 border-theme-border overflow-hidden shrink-0">
          <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
        </div>

        <div class="space-y-1.5 w-full min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-theme-accent font-bold">
            ┌──[ ALBUM DETAILS ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-bright truncate">
            {{ album.title }}
          </h1>
          <p 
            @click="router.push(`/artists/${album.artistId}`)" 
            class="text-xs font-bold text-theme-accent hover:underline cursor-pointer"
          >
            &gt; ARTIST: {{ album.artistName }}
          </p>

          <div class="text-[11px] text-theme-text-dim space-x-2 pt-0.5">
            <span>YEAR: <span class="text-theme-text font-bold">{{ album.year || 'N/A' }}</span></span>
            <span>|</span>
            <span>TRACKS: <span class="text-theme-success font-bold">{{ tracks.length }}</span></span>
            <span>|</span>
            <span>DURATION: {{ formatTime(album.duration) }}</span>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              class="bg-theme-success hover:opacity-90 text-white font-extrabold px-3 py-1 text-xs border border-theme-success transition-colors cursor-pointer"
            >
              <span>[ ▶ PLAY ALL ]</span>
            </button>
            <button
              @click="playShuffled"
              class="bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>[ ⇄ SHUFFLE ]</span>
            </button>
            <button
              @click="toggleFavorite('album', album.id)"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('album', album.id) ? 'bg-theme-danger text-white border-theme-danger' : 'bg-theme-panel text-theme-text-dim border-theme-border-dim hover:border-theme-accent hover:text-theme-accent'"
            >
              <span>{{ isFavorite('album', album.id) ? '[★ IN FAVORITES]' : '[☆ ADD FAVORITE]' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tracks List Table in Curses box -->
      <div class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-accent">
          <span class="truncate">┌──[ TRACKLIST ]───────────────────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ tracks.length }} TRACKS)─┐</span>
        </div>
        <div class="border border-theme-border-dim bg-theme-surface">
          <TrackRow
            v-for="(track, idx) in tracks"
            :key="track.id"
            :track="track"
            :index="idx"
            :playlistContext="tracks"
          />
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
