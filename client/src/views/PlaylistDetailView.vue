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
  <div class="p-6 space-y-6">
    <button
      @click="router.back()"
      class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
    >
      <ArrowLeft class="w-3.5 h-3.5" /> Torna indietro
    </button>

    <!-- Hidden file input for uploading custom playlist photo -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelected"
    />

    <!-- Playlist Hero Card -->
    <div v-if="playlist" class="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 shadow-xl backdrop-blur">
      <!-- Playlist Cover with Upload Overlay -->
      <div class="relative group shrink-0">
        <div class="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 shadow-2xl">
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
          class="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-slate-200 transition-opacity backdrop-blur-xs cursor-pointer border-2 border-emerald-400/80"
          title="Cambia copertina playlist"
        >
          <Loader2 v-if="isUploading" class="w-6 h-6 animate-spin text-emerald-400" />
          <template v-else>
            <Camera class="w-6 h-6 text-emerald-400" />
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-200">Cambia Foto</span>
          </template>
        </button>
      </div>

      <div class="space-y-3 min-w-0 flex-1 text-center sm:text-left">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Playlist</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 truncate">
            {{ playlist.name }}
          </h1>
          <div class="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 mt-2">
            <span>{{ playlistTracks.length }} brani</span>
            <span>•</span>
            <span>{{ formatTime(playlist.totalDuration) }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
          <button
            @click="playAll"
            :disabled="rawTracks.length === 0"
            class="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Play class="w-4 h-4 fill-current translate-x-0.5" />
            <span>Riproduci</span>
          </button>
          <button
            @click="playShuffled"
            :disabled="rawTracks.length === 0"
            class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700/60 hover:scale-105 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Shuffle class="w-3.5 h-3.5" />
            <span>Casuale</span>
          </button>
          <button
            v-if="playlist"
            @click="toggleFavorite('playlist', playlist.id)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer"
            :class="[
              isFavorite('playlist', playlist.id)
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            ]"
          >
            <Heart
              class="w-4 h-4"
              :class="{ 'fill-rose-500 text-rose-500': isFavorite('playlist', playlist.id) }"
            />
            <span>{{ isFavorite('playlist', playlist.id) ? 'Nei Preferiti' : 'Aggiungi ai Preferiti' }}</span>
          </button>
          <button
            @click="handleDelete"
            class="p-2.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Elimina playlist"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tracks List -->
    <div v-if="playlistTracks.length > 0" class="space-y-2">
      <h2 class="text-sm font-bold text-slate-200 tracking-wide">Brani della Playlist</h2>
      <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
        <div
          v-for="(pt, idx) in playlistTracks"
          :key="pt.id"
          class="group flex items-center justify-between"
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
            class="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            title="Rimuovi dalla playlist"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="text-center py-20 text-slate-500">
      <ListMusic class="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-400" />
      <p class="text-sm">Questa playlist è vuota.</p>
      <p class="text-xs text-slate-600 mt-1">Puoi aggiungere brani da qualsiasi album usando il pulsante "+" sulla riga del brano.</p>
    </div>
  </div>
</template>
