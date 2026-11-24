<script setup lang="ts">
import { ref } from 'vue';
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
    class="group flex items-center justify-between px-2 py-1 text-xs select-none transition-colors border-b border-theme-border-subtle font-mono cursor-pointer"
    :class="[
      playerState.currentTrack?.id === track.id
        ? 'bg-theme-accent text-theme-accent-contrast font-extrabold border-theme-accent'
        : 'text-theme-text hover:bg-theme-active-bg hover:text-white'
    ]"
  >
    <!-- Left: Index / Play & Title -->
    <div @click="play" class="flex items-center gap-2 min-w-0 flex-1">
      <!-- Index or Play cursor -->
      <span 
        class="w-7 text-center font-mono text-[10px] shrink-0"
        :class="playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast font-extrabold' : 'text-theme-text-dim group-hover:text-white'"
      >
        <span v-if="playerState.currentTrack?.id === track.id">►►</span>
        <template v-else>
          <span class="group-hover:hidden">{{ index !== undefined ? String(index + 1).padStart(2, '0') : '..' }}.</span>
          <span class="hidden group-hover:inline font-bold">►</span>
        </template>
      </span>

      <!-- Title & Artist -->
      <div class="min-w-0 flex-1 flex items-baseline gap-2">
        <p class="font-bold truncate" :class="playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast' : 'text-theme-text group-hover:text-white'">
          {{ track.title }}
        </p>
        <p 
          class="text-[10px] truncate shrink-0"
          :class="playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast/80' : 'text-theme-accent group-hover:text-white/80 opacity-85'"
        >
          {{ track.artistName }}
        </p>
      </div>

      <!-- Optional Album column -->
      <div 
        v-if="showAlbum" 
        class="hidden md:block w-1/4 min-w-0 truncate text-[10px]"
        :class="playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast/80' : 'text-theme-text-dim group-hover:text-white/70'"
      >
        [{{ track.albumTitle }}]
      </div>
    </div>

    <!-- Right: Duration & Quick Actions in TUI bracket format -->
    <div class="flex items-center gap-1.5 shrink-0 ml-2">
      <!-- Action buttons (visible on hover) -->
      <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          @click.stop="playerActions.playNext(track)"
          class="px-1 text-[10px] font-bold border transition-colors cursor-pointer"
          :class="playerState.currentTrack?.id === track.id 
            ? 'bg-theme-bg text-theme-accent border-theme-bg hover:bg-theme-accent hover:text-theme-accent-contrast' 
            : 'bg-theme-panel text-theme-accent border-theme-border-dim hover:bg-theme-accent hover:text-theme-accent-contrast'"
          title="Play next (↳)"
        >
          [↳]
        </button>
        <button
          @click.stop="playerActions.addToQueue(track)"
          class="px-1 text-[10px] font-bold border transition-colors cursor-pointer"
          :class="playerState.currentTrack?.id === track.id 
            ? 'bg-theme-bg text-theme-accent border-theme-bg hover:bg-theme-accent hover:text-theme-accent-contrast' 
            : 'bg-theme-panel text-theme-accent border-theme-border-dim hover:bg-theme-accent hover:text-theme-accent-contrast'"
          title="Add to queue (+QUEUE)"
        >
          [+C]
        </button>
        <button
          @click.stop="showPlaylistModal = true"
          class="px-1 text-[10px] font-bold border transition-colors cursor-pointer"
          :class="playerState.currentTrack?.id === track.id 
            ? 'bg-theme-bg text-theme-accent border-theme-bg hover:bg-theme-accent hover:text-theme-accent-contrast' 
            : 'bg-theme-panel text-theme-accent border-theme-border-dim hover:bg-theme-accent hover:text-theme-accent-contrast'"
          title="Add to playlist (+LIST)"
        >
          [+L]
        </button>
      </div>

      <!-- Favorite button -->
      <button
        @click.stop="toggleFavorite('track', track.id)"
        class="px-0.5 text-[11px] font-bold transition-all cursor-pointer"
        :class="[
          isFavorite('track', track.id)
            ? (playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast' : 'text-theme-danger')
            : (playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast/60' : 'text-theme-text-dim hover:text-theme-danger opacity-40 group-hover:opacity-100 group-hover:text-white/70')
        ]"
        :title="isFavorite('track', track.id) ? 'Remove from favorites' : 'Add to favorites'"
      >
        <span>{{ isFavorite('track', track.id) ? '[★]' : '[☆]' }}</span>
      </button>

      <!-- Duration -->
      <span 
        class="w-11 text-right font-mono text-[10px] tabular-nums"
        :class="playerState.currentTrack?.id === track.id ? 'text-theme-accent-contrast' : 'text-theme-text-dim group-hover:text-white/80'"
      >
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
