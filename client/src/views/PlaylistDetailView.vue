<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Camera, Loader2 } from '@lucide/vue';
import { fetchPlaylist, removeTrackFromPlaylist, deletePlaylist, uploadPlaylistImage } from '../api/client';
import { playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
import TuiWindow from '../components/TuiWindow.vue';
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
  <TuiWindow 
    :title="playlist ? `PLAYLIST: ${playlist.name}` : 'CARICAMENTO...'" 
    :badge="playlist ? `${playlistTracks.length} BRANI / ${formatTime(playlist.totalDuration)}` : ''"
    variant="green"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-xs border-b border-[#003311] pb-2">
        <button
          @click="router.back()"
          class="bg-[#001710] hover:bg-[#00ff66] hover:text-black text-[#00ff66] border border-[#005522] px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <span>[&lt; INDIETRO]</span>
        </button>
        <span class="text-[#006622]">&gt; RACCOLTE &gt; PLAYLIST &gt;</span>
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

      <!-- Playlist Hero Card in Curses Box -->
      <div v-if="playlist" class="border border-[#005522] bg-[#000d07] p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <!-- Playlist Cover with Upload Overlay -->
        <div class="relative group shrink-0">
          <div class="w-28 h-28 sm:w-32 sm:h-32 bg-black border-2 border-[#00ff66] overflow-hidden">
            <img
              :src="playlistCoverUrl"
              :alt="playlist.name"
              class="w-full h-full object-cover"
            />
          </div>

          <button
            @click="triggerPhotoUpload"
            :disabled="isUploading"
            type="button"
            class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-[#00ff66] transition-opacity cursor-pointer border-2 border-[#00ff66]"
            title="Cambia copertina playlist"
          >
            <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
            <template v-else>
              <Camera class="w-4 h-4" />
              <span class="text-[8px] font-bold">[COVER]</span>
            </template>
          </button>
        </div>

        <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-[#00ff66] font-bold">
            ┌──[ DETTAGLI PLAYLIST ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
            {{ playlist.name }}
          </h1>
          <div class="text-[11px] text-[#00aa44] space-x-2">
            <span>BRANI: <span class="text-[#00ff66] font-bold">{{ playlistTracks.length }}</span></span>
            <span>|</span>
            <span>DURATA TOTALE: {{ formatTime(playlist.totalDuration) }}</span>
          </div>

          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              :disabled="rawTracks.length === 0"
              class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-extrabold px-3 py-1 text-xs border border-[#00ff66] transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>[ ▶ RIPRODUCI ]</span>
            </button>
            <button
              @click="playShuffled"
              :disabled="rawTracks.length === 0"
              class="bg-[#001710] hover:bg-[#00ff66] hover:text-black text-[#00ff66] border border-[#005522] px-3 py-1 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>[ ⇄ CASUALE ]</span>
            </button>
            <button
              v-if="playlist"
              @click="toggleFavorite('playlist', playlist.id)"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('playlist', playlist.id) ? 'bg-[#ff3366] text-black border-[#ff3366]' : 'bg-[#001710] text-[#aaaaaa] border-[#005522] hover:border-[#ff3366] hover:text-[#ff3366]'"
            >
              <span>{{ isFavorite('playlist', playlist.id) ? '[★ NEI PREFERITI]' : '[☆ AGGIUNGI PREFERITI]' }}</span>
            </button>
            <button
              @click="handleDelete"
              class="bg-[#2a0008] hover:bg-[#ff3366] text-[#ff3366] hover:text-black px-3 py-1 text-xs font-bold border border-[#661122] transition-colors cursor-pointer"
              title="Elimina playlist"
            >
              <span>[ELIMINA]</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tracks List Table -->
      <div v-if="playlistTracks.length > 0" class="space-y-2">
        <div class="border-b border-[#003311] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
          <span>┌──[ BRANI CONTENUTI ]───────────────────────────</span>
          <span class="text-[#ffff00]">({{ playlistTracks.length }})─┐</span>
        </div>
        <div class="border border-[#003311] bg-[#000d07]">
          <div
            v-for="(pt, idx) in playlistTracks"
            :key="pt.id"
            class="flex items-center justify-between border-b border-[#00220d] hover:bg-[#001f11] group"
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
              class="text-[#446655] hover:text-[#ff3366] text-xs font-bold px-2 py-1 mr-1 cursor-pointer"
              title="Rimuovi dalla playlist"
            >
              [X]
            </button>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
