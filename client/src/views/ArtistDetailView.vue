<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Camera, Loader2 } from '@lucide/vue';
import { fetchArtist, uploadArtistImage } from '../api/client';
import { playerActions } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
import TuiWindow from '../components/TuiWindow.vue';
import type { Artist, Album, Track } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const artist = ref<Artist | null>(null);
const albums = ref<Album[]>([]);
const tracks = ref<Track[]>([]);
const isLoading = ref(true);
const isUploading = ref(false);
const imageTimestamp = ref(Date.now());
const fileInput = ref<HTMLInputElement | null>(null);

const artistId = computed(() => route.params.id as string);

const artistImageUrl = computed(() => {
  return `/api/artists/${artistId.value}/image?t=${imageTimestamp.value}`;
});

async function loadData() {
  try {
    const data = await fetchArtist(artistId.value);
    artist.value = data.artist;
    albums.value = data.albums;
    tracks.value = data.tracks;
  } catch (err) {
    console.error('Failed to load artist:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadData);

function playAll() {
  if (tracks.value.length > 0) {
    playerActions.playTrack(tracks.value[0], tracks.value);
  }
}

async function handleToggleFavorite() {
  if (!artist.value) return;
  try {
    await toggleFavorite('artist', artist.value.id);
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
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
      await uploadArtistImage(artistId.value, base64);
      imageTimestamp.value = Date.now();
    } catch (err) {
      console.error('Error uploading artist photo:', err);
      alert('Error uploading artist photo.');
    } finally {
      isUploading.value = false;
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <TuiWindow 
    :title="artist ? `ARTIST: ${artist.name}` : 'LOADING...'" 
    :badge="artist ? `${albums.length} ALBUMS / ${tracks.length} TRACKS` : ''"
    variant="default"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Breadcrumb / Back button -->
      <div class="flex flex-wrap items-center gap-2 text-xs border-b border-theme-border-subtle pb-2">
        <button
          @click="router.back()"
          class="bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <span>[&lt; BACK]</span>
        </button>
        <span class="hidden sm:inline text-theme-text-dim">&gt; DIRECTORY &gt; ARTISTS &gt;</span>
        <span class="text-theme-accent font-bold truncate" v-if="artist">[{{ artist.name }}]</span>
      </div>

      <!-- Hidden file input for uploading custom artist photo -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelected"
      />

      <!-- Artist Info Card in Curses Box -->
      <div v-if="artist" class="border border-theme-border-dim bg-theme-panel p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <!-- Photo Frame -->
        <div class="relative group shrink-0">
          <div class="w-24 h-24 sm:w-28 sm:h-28 bg-black border-2 border-theme-border overflow-hidden">
            <img
              :src="artistImageUrl"
              :alt="artist.name"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Upload overlay button (desktop hover) -->
          <button
            @click="triggerPhotoUpload"
            :disabled="isUploading"
            type="button"
            class="hidden md:flex absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex-col items-center justify-center gap-1 text-theme-accent transition-opacity cursor-pointer border-2 border-theme-accent"
            title="Change artist photo"
          >
            <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
            <template v-else>
              <Camera class="w-4 h-4" />
              <span class="text-[8px] font-bold">[PHOTO]</span>
            </template>
          </button>

          <!-- Upload corner button (mobile touch) -->
          <button
            @click="triggerPhotoUpload"
            :disabled="isUploading"
            type="button"
            class="md:hidden absolute bottom-1 right-1 bg-theme-bg/90 text-theme-accent border border-theme-accent px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
            title="Change artist photo"
          >
            <Loader2 v-if="isUploading" class="w-3 h-3 animate-spin" />
            <template v-else>
              <Camera class="w-3 h-3" />
              <span>[PHOTO]</span>
            </template>
          </button>
        </div>

        <div class="space-y-1.5 w-full min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-theme-accent font-bold">
            ┌──[ ARTIST DETAILS ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-bright truncate">
            {{ artist.name }}
          </h1>
          <p class="text-xs text-theme-text-dim">
            DISCOGRAPHY: <span class="text-theme-accent font-bold">{{ albums.length }} ALBUMS</span> | TRACKS: <span class="text-theme-success font-bold">{{ tracks.length }} TRACKS</span>
          </p>

          <!-- Actions: Play All & Favorite -->
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              class="bg-theme-success hover:opacity-90 text-white font-extrabold px-3 py-1 text-xs border border-theme-success transition-colors cursor-pointer"
            >
              <span>[ ▶ PLAY ALL ]</span>
            </button>

            <button
              @click="handleToggleFavorite"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('artist', artist.id) ? 'bg-theme-danger text-white border-theme-danger' : 'bg-theme-panel text-theme-text-dim border-theme-border-dim hover:border-theme-accent hover:text-theme-accent'"
            >
              <span>{{ isFavorite('artist', artist.id) ? '[★ IN FAVORITES]' : '[☆ ADD FAVORITE]' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Albums Section -->
      <div v-if="albums.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-accent">
          <span class="truncate">┌──[ AVAILABLE ALBUMS ]─────────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ albums.length }})─┐</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <div
            v-for="alb in albums"
            :key="alb.id"
            @click="router.push(`/albums/${alb.id}`)"
            class="group p-2 bg-theme-panel border border-theme-border-dim hover:border-theme-accent hover:bg-theme-active-bg transition-colors cursor-pointer relative"
          >
            <div class="relative aspect-square bg-black border border-theme-border-dim group-hover:border-theme-accent overflow-hidden mb-1.5">
              <img :src="alb.coverUrl" :alt="alb.title" class="w-full h-full object-cover" />

              <button
                type="button"
                @click.stop="toggleFavorite('album', alb.id)"
                class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors cursor-pointer bg-theme-bg/85 md:bg-transparent px-0.5 md:px-0"
                :class="[
                  isFavorite('album', alb.id)
                    ? 'text-theme-danger'
                    : 'text-theme-text hover:text-theme-danger opacity-95 md:opacity-0 md:group-hover:opacity-100'
                ]"
                :title="isFavorite('album', alb.id) ? 'Remove from favorites' : 'Add to favorites'"
              >
                <span>{{ isFavorite('album', alb.id) ? '[★]' : '[☆]' }}</span>
              </button>
            </div>
            <p class="text-xs font-bold text-theme-text group-hover:text-white truncate transition-colors">
              {{ alb.title }}
            </p>
            <p class="text-[10px] text-theme-text-dim">YEAR: {{ alb.year || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Tracks Table -->
      <div v-if="tracks.length > 0" class="space-y-2">
        <div class="border-b border-theme-border-subtle pb-1 flex items-center justify-between gap-2 text-xs font-bold text-theme-accent">
          <span class="truncate">┌──[ COMPLETE TRACKLIST ]────────────────────────</span>
          <span class="text-theme-highlight shrink-0">({{ tracks.length }} TRACKS)─┐</span>
        </div>
        <div class="border border-theme-border-dim bg-theme-surface">
          <TrackRow
            v-for="(track, idx) in tracks"
            :key="track.id"
            :track="track"
            :index="idx"
            :playlistContext="tracks"
            :showAlbum="true"
          />
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
