<script setup lang="ts">
import { ref } from 'vue';
import { Play, ListPlus, CornerDownRight, Plus } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
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
    class="group flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-800/70 select-none transition-colors border border-transparent hover:border-slate-800"
    :class="[
      playerState.currentTrack?.id === track.id ? 'bg-sky-500/10 text-sky-400 font-medium' : 'text-slate-300'
    ]"
  >
    <!-- Left: Index / Play & Title -->
    <div @click="play" class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
      <!-- Index or Play icon -->
      <span class="w-6 text-center text-slate-500 font-mono text-[11px] group-hover:hidden">
        {{ index !== undefined ? index + 1 : (track.trackNumber || '•') }}
      </span>
      <span class="w-6 hidden group-hover:flex items-center justify-center text-sky-400">
        <Play class="w-3.5 h-3.5 fill-current" />
      </span>

      <!-- Title & Artist -->
      <div class="min-w-0 flex-1">
        <p class="font-semibold truncate" :class="{ 'text-sky-400': playerState.currentTrack?.id === track.id }">
          {{ track.title }}
        </p>
        <p class="text-[11px] text-slate-400 truncate">{{ track.artistName }}</p>
      </div>

      <!-- Optional Album column -->
      <div v-if="showAlbum" class="hidden md:block w-1/3 min-w-0 truncate text-slate-400 text-[11px]">
        {{ track.albumTitle }}
      </div>
    </div>

    <!-- Right: Duration & Quick Actions -->
    <div class="flex items-center gap-1 shrink-0 ml-3">
      <!-- Action buttons (visible on hover) -->
      <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          @click.stop="playerActions.playNext(track)"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-700/60"
          title="Riproduci dopo questo brano"
        >
          <CornerDownRight class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="playerActions.addToQueue(track)"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-700/60"
          title="Aggiungi alla coda"
        >
          <ListPlus class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="showPlaylistModal = true"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-700/60"
          title="Aggiungi a playlist"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Duration -->
      <span class="w-12 text-right font-mono text-[11px] text-slate-400 tabular-nums">
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
