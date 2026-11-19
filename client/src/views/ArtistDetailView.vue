<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Users, 
  ArrowLeft, 
  Play, 
  Disc3, 
  Heart, 
  Camera, 
  UploadCloud, 
  Loader2 
} from '@lucide/vue';
import { fetchArtist, uploadArtistImage } from '../api/client';
import { playerActions } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TrackRow from '../components/TrackRow.vue';
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
      alert('Errore durante il caricamento della foto dell\'artista.');
    } finally {
      isUploading.value = false;
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <div class="p-6 space-y-6">
    <button
      @click="router.back()"
      class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
    >
      <ArrowLeft class="w-3.5 h-3.5" /> Torna indietro
    </button>

    <!-- Hidden file input for uploading custom artist photo -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelected"
    />

    <!-- Artist Banner -->
    <div v-if="artist" class="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 shadow-xl backdrop-blur">
      <!-- Avatar with Upload Overlay -->
      <div class="relative group shrink-0">
        <div class="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700/80 shadow-2xl">
          <img
            :src="artistImageUrl"
            :alt="artist.name"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Upload overlay button -->
        <button
          @click="triggerPhotoUpload"
          :disabled="isUploading"
          type="button"
          class="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-slate-200 transition-opacity backdrop-blur-xs cursor-pointer border-2 border-sky-400/80"
          title="Cambia foto artista"
        >
          <Loader2 v-if="isUploading" class="w-6 h-6 animate-spin text-sky-400" />
          <template v-else>
            <Camera class="w-6 h-6 text-sky-400" />
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-200">Cambia Foto</span>
          </template>
        </button>
      </div>

      <div class="space-y-2 min-w-0 flex-1 text-center sm:text-left">
        <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">Artista</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight truncate">
          {{ artist.name }}
        </h1>
        <p class="text-xs text-slate-400">
          {{ albums.length }} album • {{ tracks.length }} brani
        </p>

        <!-- Actions: Play All & Favorite -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
          <button
            @click="playAll"
            class="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 hover:scale-105 transition-all"
          >
            <Play class="w-4 h-4 fill-current translate-x-0.5" />
            <span>Riproduci tutti i brani</span>
          </button>

          <button
            @click="handleToggleFavorite"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all"
            :class="[
              isFavorite('artist', artist.id)
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            ]"
          >
            <Heart
              class="w-4 h-4"
              :class="{ 'fill-rose-500 text-rose-500': isFavorite('artist', artist.id) }"
            />
            <span>{{ isFavorite('artist', artist.id) ? 'Nei Preferiti' : 'Aggiungi ai Preferiti' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Albums section -->
    <div v-if="albums.length > 0" class="space-y-3">
      <h2 class="text-sm font-bold text-slate-200 tracking-wide">Album</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="alb in albums"
          :key="alb.id"
          @click="router.push(`/albums/${alb.id}`)"
          class="group p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer relative"
        >
          <div class="relative aspect-square rounded-lg overflow-hidden bg-slate-800 mb-2 shadow">
            <img :src="alb.coverUrl" :alt="alb.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />

            <!-- Favorite Button Overlay -->
            <button
              type="button"
              @click.stop="toggleFavorite('album', alb.id)"
              class="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-rose-400 backdrop-blur transition-all z-10"
              :class="[
                isFavorite('album', alb.id)
                  ? 'opacity-100 text-rose-500'
                  : 'opacity-0 group-hover:opacity-100'
              ]"
              :title="isFavorite('album', alb.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
            >
              <Heart
                class="w-3.5 h-3.5 transition-transform hover:scale-110"
                :class="{ 'fill-rose-500 text-rose-500': isFavorite('album', alb.id) }"
              />
            </button>
          </div>
          <p class="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
            {{ alb.title }}
          </p>
          <p class="text-[11px] text-slate-400">{{ alb.year || '' }}</p>
        </div>
      </div>
    </div>

    <!-- Tracks section -->
    <div v-if="tracks.length > 0" class="space-y-3">
      <h2 class="text-sm font-bold text-slate-200 tracking-wide">Tutti i Brani</h2>
      <div class="bg-slate-900/40 rounded-xl border border-slate-800/40 p-2 space-y-1">
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
</template>
