<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ListMusic, 
  ArrowLeft, 
  Play, 
  Shuffle, 
  Trash2, 
  X, 
  Heart,
  Camera,
  Loader2
} from '@lucide/vue';
import { fetchPlaylist, removeTrackFromPlaylist, deletePlaylist, uploadPlaylistImage } from '../api/client';
import { playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
import type { Playlist, PlaylistTrack } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const playlist = ref<Playlist | null>(null);
const playlistTracks = ref<PlaylistTrack[]>([]);
const isLoading = ref(true);
const isUploading = ref(false);
const imageTimestamp = ref(Date.now());
const fileInput = ref<HTMLInputElement | null>(null);

const playlistId = computed(() => route.params.id as string);

const playlistCoverUrl = computed(() => {
  return `/api/playlists/${playlistId.value}/cover?t=${imageTimestamp.value}`;
});

async function load() {
  try {
    const data = await fetchPlaylist(playlistId.value);
    playlist.value = data.playlist;
    playlistTracks.value = data.tracks;
  } catch (err) {
    console.error('Failed to load playlist:', err);
  } finally {
    isLoading.value = false;
  }
}

const rawTracks = computed(() => playlistTracks.value.map(pt => pt.track));

function playAll() {
  if (rawTracks.value.length > 0) {
    playerActions.playTrack(rawTracks.value[0], rawTracks.value);
  }
}

function playShuffled() {
  if (rawTracks.value.length > 0) {
    const shuffled = [...rawTracks.value].sort(() => Math.random() - 0.5);
    playerActions.playTrack(shuffled[0], shuffled);
  }
}

async function handleRemove(ptId: string) {
  try {
    await removeTrackFromPlaylist(playlistId.value, ptId);
    playlistTracks.value = playlistTracks.value.filter(pt => pt.id !== ptId);
  } catch (err) {
    console.error('Failed to remove track:', err);
  }
}

async function handleDelete() {
  if (!confirm('Eliminare definitivamente questa playlist?')) return;
  try {
    await deletePlaylist(playlistId.value);
    router.push('/playlists');
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  }
}

function triggerPhotoUpload() {
  fileInput.value?.click();
}

async function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploading.value = true;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = reader.result as string;
      await uploadPlaylistImage(playlistId.value, base64);
      imageTimestamp.value = Date.now();
    } catch (err) {
      console.error('Error uploading playlist photo:', err);
      alert('Errore durante il caricamento della foto della playlist.');
    } finally {
      isUploading.value = false;
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsDataURL(file);
}

onMounted(load);
</script>

<template>
  <div class="space-y-4 font-mono select-none">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs">
      <button
        @click="router.back()"
        class="bbs-btn py-0.5 px-2 text-xs border-[#333333]"
      >
        <span>[&lt; INDIETRO]</span>
      </button>
      <span class="text-[#555555]">&gt; MENU &gt; PLAYLIST &gt;</span>
      <span class="text-[#00ff66] font-bold" v-if="playlist">[{{ playlist.name }}]</span>
    </div>

    <!-- Hidden file input for uploading custom playlist photo -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelected"
    />

    <!-- Playlist Hero Card in BBS Box -->
    <div v-if="playlist" class="border border-[#2a2a2a] bg-[#070707] p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <!-- Playlist Cover with Upload Overlay -->
      <div class="relative group shrink-0">
        <div class="w-32 h-32 sm:w-36 sm:h-36 bg-black border-2 border-[#00ff66] overflow-hidden">
          <img
            :src="playlistCoverUrl"
            :alt="playlist.name"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Upload overlay button -->
        <button
          @click="triggerPhotoUpload"
          :disabled="isUploading"
          type="button"
          class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-[#00ff66] transition-opacity cursor-pointer border-2 border-[#00ff66]"
          title="Cambia copertina playlist"
        >
          <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
          <template v-else>
            <Camera class="w-5 h-5" />
            <span class="text-[9px] font-bold">[CAMBIA COVER]</span>
          </template>
        </button>
      </div>

      <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
        <div class="text-[10px] text-[#00ff66] font-bold">
          ■ PLAYLIST UTENTE
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
          {{ playlist.name }}
        </h1>
        <div class="text-[11px] text-[#888888] space-x-2">
          <span>BRANI: <span class="text-[#00ff66]">{{ playlistTracks.length }}</span></span>
          <span>|</span>
          <span>DURATA: {{ formatTime(playlist.totalDuration) }}</span>
        </div>

        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
          <button
            @click="playAll"
            :disabled="rawTracks.length === 0"
            class="bbs-btn bbs-btn-green py-1.5 px-3 text-xs disabled:opacity-40"
          >
            <span>[ ▶ RIPRODUCI ]</span>
          </button>
          <button
            @click="playShuffled"
            :disabled="rawTracks.length === 0"
            class="bbs-btn py-1.5 px-3 text-xs border-[#333333] text-[#cccccc] disabled:opacity-40"
          >
            <span>[ ⇄ CASUALE ]</span>
          </button>
          <button
            v-if="playlist"
            @click="toggleFavorite('playlist', playlist.id)"
            class="bbs-btn py-1.5 px-3 text-xs"
            :class="isFavorite('playlist', playlist.id) ? 'bbs-btn-red' : 'border-[#333333] text-[#aaaaaa]'"
          >
            <span>{{ isFavorite('playlist', playlist.id) ? '[★ NEI PREFERITI]' : '[☆ AGGIUNGI PREFERITI]' }}</span>
          </button>
          <button
            @click="handleDelete"
            class="bbs-btn bbs-btn-red py-1.5 px-3 text-xs"
            title="Elimina playlist"
          >
            <span>[ELIMINA PLAYLIST]</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tracks List -->
    <div v-if="playlistTracks.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
        <span>■ [ BRANI IN PLAYLIST ] ──────────────────────────</span>
        <span class="text-[#ffff00]">({{ playlistTracks.length }})</span>
      </div>
      <div class="border border-[#222222] bg-[#070707]">
        <div
          v-for="(pt, idx) in playlistTracks"
          :key="pt.id"
          class="flex items-center justify-between border-b border-[#1c1c1c] hover:bg-[#001710] group"
        >
          <div class="flex-1 min-w-0">
            <TrackRow
              :track="pt.track"
              :index="idx"
              :playlistContext="rawTracks"
              :showAlbum="true"
            />
          </div>
          <button
            @click="handleRemove(pt.id)"
            class="text-[#555555] hover:text-[#ff3366] text-xs font-bold px-2 py-1 mr-1"
            title="Rimuovi dalla playlist"
          >
            [X]
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="border border-[#222222] p-12 text-center text-[#666666]">
      <ListMusic class="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00ff66]" />
      <p class="text-xs">&gt; PLAYLIST VUOTA &lt;</p>
      <p class="text-[10px] text-[#555555] mt-1">Aggiungi brani usando il pulsante [+LIST] sui singoli brani.</p>
    </div>
  </div>
</template>
