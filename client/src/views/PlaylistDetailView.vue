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
  if (!confirm('Permanently delete this playlist?')) return;
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
      alert('Error uploading playlist cover.');
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
    :title="playlist ? `PLAYLIST: ${playlist.name}` : 'LOADING...'" 
    :badge="playlist ? `${playlistTracks.length} TRACKS / ${formatTime(playlist.totalDuration)}` : ''"
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
        <span class="hidden sm:inline text-theme-text-dim">&gt; COLLECTIONS &gt; PLAYLISTS &gt;</span>
        <span class="text-theme-accent font-bold truncate" v-if="playlist">[{{ playlist.name }}]</span>
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
      <div v-if="playlist" class="border border-theme-border-dim bg-theme-panel p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <!-- Playlist Cover with Upload Overlay -->
        <div class="relative group shrink-0">
          <div class="w-28 h-28 sm:w-32 sm:h-32 bg-black border-2 border-theme-border overflow-hidden">
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
            class="hidden md:flex absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex-col items-center justify-center gap-1 text-theme-accent transition-opacity cursor-pointer border-2 border-theme-accent"
            title="Change playlist cover"
          >
            <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
            <template v-else>
              <Camera class="w-4 h-4" />
              <span class="text-[8px] font-bold">[COVER]</span>
            </template>
          </button>

          <button
            @click="triggerPhotoUpload"
            :disabled="isUploading"
            type="button"
            class="md:hidden absolute bottom-1 right-1 bg-theme-bg/90 text-theme-accent border border-theme-accent px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
            title="Change playlist cover"
          >
            <Loader2 v-if="isUploading" class="w-3 h-3 animate-spin" />
            <template v-else>
              <Camera class="w-3 h-3" />
              <span>[COVER]</span>
            </template>
          </button>
        </div>

        <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-theme-accent font-bold">
            ┌──[ PLAYLIST DETAILS ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-bright truncate">
            {{ playlist.name }}
          </h1>
          <div class="text-[11px] text-theme-text-dim space-x-2">
            <span>TRACKS: <span class="text-theme-success font-bold">{{ playlistTracks.length }}</span></span>
            <span>|</span>
            <span>TOTAL DURATION: {{ formatTime(playlist.totalDuration) }}</span>
          </div>

          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              :disabled="rawTracks.length === 0"
              class="bg-theme-success hover:opacity-90 text-white font-extrabold px-3 py-1 text-xs border border-theme-success transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>[ ▶ PLAY ]</span>
            </button>
            <button
              @click="playShuffled"
              :disabled="rawTracks.length === 0"
              class="bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim px-3 py-1 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>[ ⇄ SHUFFLE ]</span>
            </button>
            <button
              v-if="playlist"
              @click="toggleFavorite('playlist', playlist.id)"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('playlist', playlist.id) ? 'bg-theme-danger text-white border-theme-danger' : 'bg-theme-panel text-theme-text-dim border-theme-border-dim hover:border-theme-danger hover:text-theme-danger'"
            >
              <span>{{ isFavorite('playlist', playlist.id) ? '[★ IN FAVORITES]' : '[☆ ADD FAVORITE]' }}</span>
            </button>
            <button
              @click="handleDelete"
              class="bg-theme-panel hover:bg-theme-danger hover:text-white text-theme-danger px-3 py-1 text-xs font-bold border border-theme-danger/40 transition-colors cursor-pointer"
              title="Delete playlist"
            >
              <span>[DELETE]</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tracks List Table -->
      <div v-if="playlistTracks.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-accent">
          <span class="truncate">┌──[ INCLUDED TRACKS ]───────────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ playlistTracks.length }})─┐</span>
        </div>
        <div class="border border-theme-border-dim bg-theme-surface">
          <div
            v-for="(pt, idx) in playlistTracks"
            :key="pt.id"
            class="flex items-center justify-between border-b border-theme-border-subtle hover:bg-theme-active-bg group"
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
              class="text-theme-text-dim hover:text-theme-danger text-xs font-bold px-2 py-1 mr-1 cursor-pointer group-hover:text-white/70"
              title="Remove from playlist"
            >
              [X]
            </button>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
