<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  Volume1, 
  VolumeX, 
  ListMusic, 
  Gauge, 
  Disc3 
} from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import type { PlaybackRate } from '@quarter-note/shared';

const router = useRouter();
const isSpeedMenuOpen = ref(false);

const speedPresets: PlaybackRate[] = [0.5, 0.75, 0.85, 1.0, 1.15, 1.25, 1.5, 2.0];

function handleSeek(e: Event) {
  const target = e.target as HTMLInputElement;
  playerActions.seek(parseFloat(target.value));
}

function handleVolume(e: Event) {
  const target = e.target as HTMLInputElement;
  playerActions.setVolume(parseFloat(target.value));
}

function selectSpeed(speed: PlaybackRate) {
  playerActions.setRate(speed);
  isSpeedMenuOpen.value = false;
}

function navigateToAlbum() {
  if (playerState.currentTrack?.albumId) {
    router.push(`/albums/${playerState.currentTrack.albumId}`);
  }
}
</script>

<template>
  <footer class="h-20 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
    <!-- LEFT: Currently Playing Track Info -->
    <div class="flex items-center gap-3 w-1/4 min-w-[200px]">
      <div 
        @click="navigateToAlbum"
        class="w-12 h-12 rounded-md bg-slate-800 shrink-0 overflow-hidden cursor-pointer group relative shadow-md"
      >
        <img
          v-if="playerState.currentTrack"
          :src="`/api/cover/${playerState.currentTrack.albumId}`"
          :alt="playerState.currentTrack.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-slate-600">
          <Disc3 class="w-6 h-6" />
        </div>
      </div>

      <div v-if="playerState.currentTrack" class="min-w-0 pr-2">
        <p class="text-xs font-semibold text-slate-100 truncate" :title="playerState.currentTrack.title">
          {{ playerState.currentTrack.title }}
        </p>
        <p 
          @click="navigateToAlbum"
          class="text-[11px] text-slate-400 truncate hover:text-sky-400 cursor-pointer transition-colors"
          :title="playerState.currentTrack.artistName"
        >
          {{ playerState.currentTrack.artistName }}
        </p>
      </div>
      <div v-else class="min-w-0">
        <p class="text-xs text-slate-500 italic">Nessun brano in riproduzione</p>
      </div>
    </div>

    <!-- CENTER: Playback Controls & Scrubber -->
    <div class="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
      <!-- Buttons row -->
      <div class="flex items-center gap-4">
        <!-- Shuffle -->
        <button
          @click="playerActions.toggleShuffle()"
          class="p-1.5 rounded-full transition-colors"
          :class="playerState.shuffle ? 'text-sky-400 hover:text-sky-300' : 'text-slate-400 hover:text-slate-200'"
          title="Riproduzione casuale"
        >
          <Shuffle class="w-4 h-4" />
        </button>

        <!-- Previous -->
        <button
          @click="playerActions.prev()"
          class="p-1.5 text-slate-300 hover:text-slate-100 transition-colors"
          title="Precedente"
        >
          <SkipBack class="w-4 h-4 fill-current" />
        </button>

        <!-- Play / Pause -->
        <button
          @click="playerActions.togglePlay()"
          class="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/25 hover:scale-105 transition-all"
          :title="playerState.isPlaying ? 'Pausa' : 'Riproduci'"
        >
          <Pause v-if="playerState.isPlaying" class="w-4 h-4 fill-current" />
          <Play v-else class="w-4 h-4 fill-current translate-x-0.5" />
        </button>

        <!-- Next -->
        <button
          @click="playerActions.next()"
          class="p-1.5 text-slate-300 hover:text-slate-100 transition-colors"
          title="Successivo"
        >
          <SkipForward class="w-4 h-4 fill-current" />
        </button>

        <!-- Repeat Mode -->
        <button
          @click="playerActions.toggleRepeat()"
          class="p-1.5 rounded-full transition-colors"
          :class="playerState.repeatMode !== 'off' ? 'text-sky-400 hover:text-sky-300' : 'text-slate-400 hover:text-slate-200'"
          :title="`Ripeti: ${playerState.repeatMode}`"
        >
          <Repeat1 v-if="playerState.repeatMode === 'one'" class="w-4 h-4" />
          <Repeat v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Time Scrubber Row -->
      <div class="flex items-center gap-2.5 w-full">
        <span class="text-[11px] font-mono text-slate-400 w-9 text-right tabular-nums">
          {{ formatTime(playerState.currentTime) }}
        </span>

        <input
          type="range"
          min="0"
          :max="playerState.duration || 100"
          :value="playerState.currentTime"
          @input="handleSeek"
          class="w-full h-1 bg-slate-700 accent-sky-400 cursor-pointer rounded-lg"
        />

        <span class="text-[11px] font-mono text-slate-400 w-9 text-left tabular-nums">
          {{ formatTime(playerState.duration) }}
        </span>
      </div>
    </div>

    <!-- RIGHT: Speed Selector (Rallentatore), Volume, Queue -->
    <div class="flex items-center justify-end gap-3 w-1/4 min-w-[200px] relative">
      <!-- SPEED SELECTOR (Rallentatore) -->
      <div class="relative">
        <button
          @click="isSpeedMenuOpen = !isSpeedMenuOpen"
          class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all"
          :class="[
            playerState.playbackRate !== 1.0
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
          ]"
          title="Velocità di riproduzione"
        >
          <Gauge class="w-3.5 h-3.5" />
          <span>{{ playerState.playbackRate }}x</span>
        </button>

        <!-- Speed Dropdown Popover -->
        <div
          v-if="isSpeedMenuOpen"
          class="absolute bottom-11 right-0 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2.5 z-50 text-xs space-y-2 select-none"
        >
          <div class="flex items-center justify-between pb-1 border-b border-slate-700/60">
            <span class="text-slate-300 font-semibold">Velocità Audio</span>
            <span class="text-sky-400 font-mono font-bold">{{ playerState.playbackRate }}x</span>
          </div>

          <!-- Presets Grid -->
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="p in speedPresets"
              :key="p"
              @click="selectSpeed(p)"
              class="py-1 rounded text-center font-mono font-medium transition-colors"
              :class="playerState.playbackRate === p ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'"
            >
              {{ p }}x
            </button>
          </div>

          <!-- Slider for fine adjustments -->
          <div class="pt-1">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              :value="playerState.playbackRate"
              @input="(e) => playerActions.setRate(parseFloat((e.target as HTMLInputElement).value) as PlaybackRate)"
              class="w-full h-1 bg-slate-700 accent-sky-400"
            />
          </div>
        </div>
      </div>

      <!-- VOLUME -->
      <div class="flex items-center gap-1.5">
        <button
          @click="playerActions.toggleMute()"
          class="text-slate-400 hover:text-slate-200 transition-colors p-1"
          :title="playerState.isMuted ? 'Riattiva volume' : 'Muto'"
        >
          <VolumeX v-if="playerState.isMuted || playerState.volume === 0" class="w-4 h-4 text-red-400" />
          <Volume1 v-else-if="playerState.volume < 0.5" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          :value="playerState.isMuted ? 0 : playerState.volume"
          @input="handleVolume"
          class="w-20 h-1 bg-slate-700 accent-sky-400 cursor-pointer"
          title="Volume"
        />
      </div>

      <!-- QUEUE DRAWER TOGGLE -->
      <button
        @click="playerActions.toggleQueue()"
        class="relative p-2 rounded-lg border transition-all"
        :class="[
          playerState.isQueueOpen
            ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
            : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
        ]"
        title="Coda di riproduzione"
      >
        <ListMusic class="w-4 h-4" />
        <span 
          v-if="playerState.queue.length > 0"
          class="absolute -top-1 -right-1 bg-sky-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none"
        >
          {{ playerState.queue.length }}
        </span>
      </button>
    </div>
  </footer>
</template>
