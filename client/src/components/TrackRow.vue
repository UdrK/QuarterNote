<script setup lang="ts">
import { ref } from 'vue';
import { Play, ListPlus, CornerDownRight, Plus, Heart } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import AddToPlaylistModal from './AddToPlaylistModal.vue';
import type { Track } from '@quarter-note/shared';

const props = defineProps<{
  track: Track;
  index?: number;
  playlistContext?: Track[];
  showAlbum?: boolean;
}>();

const showPlaylistModal = ref(false);

function play() {
  playerActions.playTrack(props.track, props.playlistContext);
}
</script>

<template>
  <div
    class="group flex items-center justify-between px-2.5 py-1.5 text-xs select-none transition-colors border-b border-[#1c1c1c] font-mono"
    :class="[
      playerState.currentTrack?.id === track.id
        ? 'bg-[#002b4d] text-[#ffff00] border-[#00ffff]'
        : 'hover:bg-[#0c0c0c] text-[#cccccc] hover:text-[#00ffff]'
    ]"
  >
    <!-- Left: Index / Play & Title -->
    <div @click="play" class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
      <!-- Index or Play cursor -->
      <span class="w-6 text-center text-[#777777] font-mono text-[11px] group-hover:hidden">
        {{ index !== undefined ? String(index + 1).padStart(2, '0') : (track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '..') }}.
      </span>
      <span class="w-6 hidden group-hover:flex items-center justify-center text-[#00ff66] font-bold">
        ►
      </span>

      <!-- Title & Artist -->
      <div class="min-w-0 flex-1">
        <p class="font-bold truncate" :class="playerState.currentTrack?.id === track.id ? 'text-[#ffff00]' : 'group-hover:text-[#ffffff]'">
          {{ track.title }}
        </p>
        <p class="text-[10px] text-[#00ffff] opacity-80 truncate">{{ track.artistName }}</p>
      </div>

      <!-- Optional Album column -->
      <div v-if="showAlbum" class="hidden md:block w-1/3 min-w-0 truncate text-[#888888] text-[11px]">
        [{{ track.albumTitle }}]
      </div>
    </div>

    <!-- Right: Duration & Quick Actions in BBS bracket format -->
    <div class="flex items-center gap-1 shrink-0 ml-3">
      <!-- Action buttons (visible on hover) -->
      <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          @click.stop="playerActions.playNext(track)"
          class="bbs-btn py-0.5 px-1.5 text-[10px] border-[#333333]"
          title="Riproduci dopo questo brano"
        >
          <span>[↳]</span>
        </button>
        <button
          @click.stop="playerActions.addToQueue(track)"
          class="bbs-btn py-0.5 px-1.5 text-[10px] border-[#333333]"
          title="Aggiungi alla coda"
        >
          <span>[+CODA]</span>
        </button>
        <button
          @click.stop="showPlaylistModal = true"
          class="bbs-btn py-0.5 px-1.5 text-[10px] border-[#333333]"
          title="Aggiungi a playlist"
        >
          <span>[+LIST]</span>
        </button>
      </div>

      <!-- Favorite button -->
      <button
        @click.stop="toggleFavorite('track', track.id)"
        class="px-1 text-[11px] font-bold transition-all"
        :class="[
          isFavorite('track', track.id)
            ? 'text-[#ff3366]'
            : 'text-[#555555] hover:text-[#ff3366] opacity-40 group-hover:opacity-100'
        ]"
        :title="isFavorite('track', track.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
      >
        <span>{{ isFavorite('track', track.id) ? '[★]' : '[☆]' }}</span>
      </button>

      <!-- Duration -->
      <span class="w-12 text-right font-mono text-[11px] text-[#888888] tabular-nums">
        {{ formatTime(track.duration) }}
      </span>
    </div>

    <!-- Modal -->
    <AddToPlaylistModal
      v-if="showPlaylistModal"
      :track="track"
      @close="showPlaylistModal = false"
    />
  </div>
</template>
