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
    variant="cyan"
  >
    <div class="space-y-4 font-mono select-none">
      <!-- Breadcrumb / Back button -->
      <div class="flex items-center gap-2 text-xs border-b border-[#1c2936] pb-2">
        <button
          @click="router.back()"
          class="bg-[#0f1f2d] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#224466] px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <span>[&lt; BACK]</span>
        </button>
        <span class="text-[#446688]">&gt; DIRECTORY &gt; ARTISTS &gt;</span>
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

      <!-- Artist Info Card in Curses Box -->
      <div v-if="artist" class="border border-[#223d54] bg-[#050a12] p-3 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <!-- Photo Frame -->
        <div class="relative group shrink-0">
          <div class="w-24 h-24 sm:w-28 sm:h-28 bg-black border-2 border-[#00ffff] overflow-hidden">
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
            title="Change artist photo"
          >
            <Loader2 v-if="isUploading" class="w-5 h-5 animate-spin" />
            <template v-else>
              <Camera class="w-4 h-4" />
              <span class="text-[8px] font-bold">[PHOTO]</span>
            </template>
          </button>
        </div>

        <div class="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
          <div class="text-[10px] text-[#00ffff] font-bold">
            ┌──[ ARTIST DETAILS ]
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-[#ffff00] truncate">
            {{ artist.name }}
          </h1>
          <p class="text-xs text-[#88aacc]">
            DISCOGRAPHY: <span class="text-[#00ffff] font-bold">{{ albums.length }} ALBUMS</span> | TRACKS: <span class="text-[#00ff66] font-bold">{{ tracks.length }} TRACKS</span>
          </p>

          <!-- Actions: Play All & Favorite -->
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <button
              @click="playAll"
              class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-extrabold px-3 py-1 text-xs border border-[#00ff66] transition-colors cursor-pointer"
            >
              <span>[ ▶ PLAY ALL ]</span>
            </button>

            <button
              @click="handleToggleFavorite"
              class="px-3 py-1 text-xs font-bold border transition-colors cursor-pointer"
              :class="isFavorite('artist', artist.id) ? 'bg-[#ff3366] text-black border-[#ff3366]' : 'bg-[#0f1f2d] text-[#aaaaaa] border-[#224466] hover:border-[#00ffff] hover:text-[#00ffff]'"
            >
              <span>{{ isFavorite('artist', artist.id) ? '[★ IN FAVORITES]' : '[☆ ADD FAVORITE]' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Albums Section -->
      <div v-if="albums.length > 0" class="space-y-2">
        <div class="border-b border-[#1c2936] pb-1 flex items-center justify-between text-xs font-bold text-[#00ffff]">
          <span>┌──[ AVAILABLE ALBUMS ]─────────────────────────</span>
          <span class="text-[#ffff00]">({{ albums.length }})─┐</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <div
            v-for="alb in albums"
            :key="alb.id"
            @click="router.push(`/albums/${alb.id}`)"
            class="group p-2 bg-[#050a12] border border-[#1a2b3c] hover:border-[#00ffff] hover:bg-[#001f33] transition-colors cursor-pointer relative"
          >
            <div class="relative aspect-square bg-black border border-[#223d54] group-hover:border-[#00ffff] overflow-hidden mb-1.5">
              <img :src="alb.coverUrl" :alt="alb.title" class="w-full h-full object-cover" />

              <button
                type="button"
                @click.stop="toggleFavorite('album', alb.id)"
                class="absolute top-1 right-1 text-xs font-bold z-10 transition-colors cursor-pointer"
                :class="[
                  isFavorite('album', alb.id)
                    ? 'text-[#ff3366]'
                    : 'text-[#445566] hover:text-[#ff3366] opacity-0 group-hover:opacity-100'
                ]"
                :title="isFavorite('album', alb.id) ? 'Remove from favorites' : 'Add to favorites'"
              >
                <span>{{ isFavorite('album', alb.id) ? '[★]' : '[☆]' }}</span>
              </button>
            </div>
            <p class="text-xs font-bold text-[#d4d4d4] group-hover:text-[#ffff00] truncate transition-colors">
              {{ alb.title }}
            </p>
            <p class="text-[10px] text-[#6688aa]">YEAR: {{ alb.year || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Tracks Table -->
      <div v-if="tracks.length > 0" class="space-y-2">
        <div class="border-b border-[#1c2936] pb-1 flex items-center justify-between text-xs font-bold text-[#00ff66]">
          <span>┌──[ COMPLETE TRACKLIST ]────────────────────────</span>
          <span class="text-[#ffff00]">({{ tracks.length }} TRACKS)─┐</span>
        </div>
        <div class="border border-[#1a2b3c] bg-[#04080e]">
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
