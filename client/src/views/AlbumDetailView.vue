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
    :title="album ? `ALBUM: ${album.title}` : 'CARICAMENTO...'" 
    :badge="album ? `${tracks.length} BRANI / ${formatTime(album.duration)}` : ''"
    variant="yellow"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-xs border-b border-[#2a2a00] pb-2">
        <button
          @click="router.back()"
          class="bg-[#1a1700] hover:bg-[#ffff00] hover:text-black text-[#ffff00] border border-[#555500] px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <span>[&lt; INDIETRO]</span>
        </button>
        <span class="text-[#666600]">&gt; CATALOGO &gt; ALBUM &gt;</span>
        <span class="text-[#ffff00] font-bold" v-if="album">[{{ album.title }}]</span>
      </div>

      <!-- Album Hero Card in Curses Box -->
      <div v-if="album" class="border border-[#444400] bg-[#090800] p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div class="w-32 h-32 sm:w-36 sm:h-36 bg-black border-2 border-[#ffff00] overflow-hidden shrink-0">
          <img :src="album.coverUrl" :alt="album.title" class="w-full h-full object-cover" />
        </div>

        <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-[#ffff00] font-bold">
            ┌──[ SCHEDA DISCOGRAFICA ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
            {{ album.title }}
          </h1>
          <p 
            @click="router.push(`/artists/${album.artistId}`)" 
            class="text-xs font-bold text-[#00ffff] hover:underline cursor-pointer"
          >
            &gt; ARTISTA: {{ album.artistName }}
          </p>

          <div class="text-[11px] text-[#888800] space-x-2 pt-0.5">
            <span>ANNO: <span class="text-[#ffff00] font-bold">{{ album.year || 'N/D' }}</span></span>
            <span>|</span>
            <span>BRANI: <span class="text-[#00ff66] font-bold">{{ tracks.length }}</span></span>
            <span>|</span>
            <span>DURATA: {{ formatTime(album.duration) }}</span>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-extrabold px-3 py-1 text-xs border border-[#00ff66] transition-colors cursor-pointer"
            >
              <span>[ ▶ RIPRODUCI TUTTO ]</span>
            </button>
            <button
              @click="playShuffled"
              class="bg-[#1a1700] hover:bg-[#ffff00] hover:text-black text-[#ffff00] border border-[#555500] px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>[ ⇄ CASUALE ]</span>
            </button>
            <button
              @click="toggleFavorite('album', album.id)"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('album', album.id) ? 'bg-[#ff3366] text-black border-[#ff3366]' : 'bg-[#1a1700] text-[#aaaaaa] border-[#555500] hover:border-[#ffff00] hover:text-[#ffff00]'"
            >
              <span>{{ isFavorite('album', album.id) ? '[★ NEI PREFERITI]' : '[☆ AGGIUNGI PREFERITI]' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tracks List Table in Curses box -->
      <div class="space-y-2">
        <div class="border-b border-[#2a2a00] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
          <span>┌──[ TRACKLIST ]───────────────────────────────────</span>
          <span class="text-[#ffff00]">({{ tracks.length }} BRANI)─┐</span>
        </div>
        <div class="border border-[#333300] bg-[#090800]">
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
