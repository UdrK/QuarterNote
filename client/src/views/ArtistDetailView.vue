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
  <div class="space-y-4 font-mono select-none">
    <!-- Breadcrumb / Back button -->
    <div class="flex items-center gap-2 text-xs">
      <button
        @click="router.back()"
        class="bbs-btn py-0.5 px-2 text-xs border-[#333333]"
      >
        <span>[&lt; INDIETRO]</span>
      </button>
      <span class="text-[#555555]">&gt; MENU &gt; ARTISTI &gt;</span>
      <span class="text-[#ffff00] font-bold" v-if="artist">[{{ artist.name }}]</span>
    </div>

    <!-- Hidden file input for uploading custom artist photo -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelected"
    />

    <!-- Artist BBS Info Header Box -->
    <div v-if="artist" class="border border-[#2a2a2a] bg-[#070707] p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <!-- Square photo frame in BBS style -->
      <div class="relative group shrink-0">
        <div class="w-28 h-28 sm:w-32 sm:h-32 bg-black border-2 border-[#00ffff] overflow-hidden">
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
          class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-[#00ffff] transition-opacity cursor-pointer border-2 border-[#00ffff]"
          title="Cambia foto artista"
        >
          <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
          <template v-else>
            <Camera class="w-5 h-5" />
            <span class="text-[9px] font-bold">[CAMBIA FOTO]</span>
          </template>
        </button>
      </div>

      <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
        <div class="text-[10px] text-[#00ffff] font-bold">
          ■ ARTISTA PROFILO
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
          {{ artist.name }}
        </h1>
        <p class="text-xs text-[#888888]">
          STATISTICHE: <span class="text-[#00ffff]">{{ albums.length }} ALBUM</span> | <span class="text-[#00ff66]">{{ tracks.length }} BRANI</span>
        </p>

        <!-- Actions: Play All & Favorite -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
          <button
            @click="playAll"
            class="bbs-btn bbs-btn-green py-1.5 px-3 text-xs"
          >
            <span>[ ▶ RIPRODUCI TUTTO ]</span>
          </button>

          <button
            @click="handleToggleFavorite"
            class="bbs-btn py-1.5 px-3 text-xs"
            :class="isFavorite('artist', artist.id) ? 'bbs-btn-red' : 'border-[#333333] text-[#aaaaaa]'"
          >
            <span>{{ isFavorite('artist', artist.id) ? '[★ NEI PREFERITI]' : '[☆ AGGIUNGI PREFERITI]' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Albums section in BBS style -->
    <div v-if="albums.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ffff]">
        <span>■ [ ALBUM DISPONIBILI ] ─────────────────────────</span>
        <span class="text-[#ffff00]">({{ albums.length }})</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="alb in albums"
          :key="alb.id"
          @click="router.push(`/albums/${alb.id}`)"
          class="group p-2 bg-[#070707] border border-[#222222] hover:border-[#00ffff] hover:bg-[#001726] transition-colors cursor-pointer relative"
        >
          <div class="relative aspect-square bg-black border border-[#333333] group-hover:border-[#00ffff] overflow-hidden mb-1.5">
            <img :src="alb.coverUrl" :alt="alb.title" class="w-full h-full object-cover" />

            <!-- Favorite Button Overlay -->
            <button
              type="button"
              @click.stop="toggleFavorite('album', alb.id)"
              class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors"
              :class="[
                isFavorite('album', alb.id)
                  ? 'text-[#ff3366]'
                  : 'text-[#444444] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
              ]"
              :title="isFavorite('album', alb.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
            >
              <span>{{ isFavorite('album', alb.id) ? '[★]' : '[☆]' }}</span>
            </button>
          </div>
          <p class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate transition-colors">
            {{ alb.title }}
          </p>
          <p class="text-[10px] text-[#888888]">ANNO: {{ alb.year || 'N/D' }}</p>
        </div>
      </div>
    </div>

    <!-- Tracks section in BBS style -->
    <div v-if="tracks.length > 0" class="space-y-2">
      <div class="border-b border-[#222222] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
        <span>■ [ TUTTI I BRANI DELL'ARTISTA ] ────────────────</span>
        <span class="text-[#ffff00]">({{ tracks.length }})</span>
      </div>
      <div class="border border-[#222222] bg-[#070707]">
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
