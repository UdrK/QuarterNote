<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Play, Shuffle, ArrowLeft, Heart } from '@lucide/vue';
import { fetchAlbum } from '../api/client';
import { playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
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
  <div class="space-y-4 font-mono select-none">
    <!-- Breadcrumb / Back button -->
    <div class="flex items-center gap-2 text-xs">
      <button
        @click="router.back()"
        class="bbs-btn py-0.5 px-2 text-xs border-[#333333]"
      >
        <span>[&lt; INDIETRO]</span>
      </button>
      <span class="text-[#555555]">&gt; MENU &gt; ALBUM &gt;</span>
      <span class="text-[#ffff00] font-bold" v-if="album">[{{ album.title }}]</span>
    </div>

    <!-- Album Hero Card in BBS Box -->
    <div v-if="album" class="border border-[#2a2a2a] bg-[#070707] p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <div class="w-36 h-36 sm:w-44 sm:h-44 bg-black border-2 border-[#00ffff] overflow-hidden shrink-0">
        <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
      </div>

      <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
        <div class="text-[10px] text-[#00ffff] font-bold">
          ■ ALBUM DETTAGLI
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
          {{ album.title }}
        </h1>
        <p 
          @click="router.push(`/artists/${album.artistId}`)" 
          class="text-xs font-bold text-[#00ffff] hover:underline cursor-pointer transition-colors"
        >
          &gt; ARTISTA: {{ album.artistName }}
        </p>

        <div class="text-[11px] text-[#888888] space-x-2 pt-0.5">
          <span>ANNO: <span class="text-[#ffff00]">{{ album.year || 'N/D' }}</span></span>
          <span>|</span>
          <span>BRANI: <span class="text-[#00ff66]">{{ tracks.length }}</span></span>
          <span>|</span>
          <span>DURATA: {{ formatTime(album.duration) }}</span>
        </div>

        <!-- Action buttons in bracketed BBS style -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
          <button
            @click="playAll"
            class="bbs-btn bbs-btn-green py-1.5 px-3 text-xs"
          >
            <span>[ ▶ RIPRODUCI TUTTO ]</span>
          </button>
          <button
            @click="playShuffled"
            class="bbs-btn py-1.5 px-3 text-xs border-[#333333] text-[#cccccc]"
          >
            <span>[ ⇄ CASUALE ]</span>
          </button>
          <button
            @click="toggleFavorite('album', album.id)"
            class="bbs-btn py-1.5 px-3 text-xs"
            :class="isFavorite('album', album.id) ? 'bbs-btn-red' : 'border-[#333333] text-[#aaaaaa]'"
          >
            <span>{{ isFavorite('album', album.id) ? '[★ NEI PREFERITI]' : '[☆ AGGIUNGI PREFERITI]' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tracks List Table in BBS style -->
    <div class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
        <span>■ [ TRACKLIST ] ───────────────────────────────────</span>
        <span class="text-[#ffff00]">({{ tracks.length }} BRANI)</span>
      </div>
      <div class="border border-[#222222] bg-[#070707]">
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
</template>
