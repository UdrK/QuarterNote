<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Disc3 } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import type { PlaybackRate } from '@quarter-note/shared';
import { t } from '../i18n';

const router = useRouter();
const isSpeedMenuOpen = ref(false);
const showAsciiArt = ref(false);

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

// ASCII progress bar calculation
const asciiBar = computed(() => {
  const total = playerState.duration || 1;
  const current = playerState.currentTime || 0;
  const barLength = 26;
  const filled = Math.min(barLength, Math.max(0, Math.round((current / total) * barLength)));
  const empty = barLength - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
});

// Animated ASCII spectrum visualizer bars when playing
const eqFrame = ref(0);
let eqTimer: ReturnType<typeof setInterval> | null = null;

const eqBars = [
  ' ▂▃▅▆▇█▇▆▅▃▂ ',
  '▂▃▅▆▇█▇▆▅▃▂  ',
  '▃▅▆▇█▇▆▅▃▂ ▂',
  '▅▆▇█▇▆▅▃▂ ▂▃',
  '▆▇█▇▆▅▃▂ ▂▃▅',
  '▇█▇▆▅▃▂ ▂▃▅▆',
  '█▇▆▅▃▂ ▂▃▅▆▇',
];

onMounted(() => {
  eqTimer = setInterval(() => {
    if (playerState.isPlaying) {
      eqFrame.value = (eqFrame.value + 1) % eqBars.length;
    }
  }, 140);
});

onUnmounted(() => {
  if (eqTimer) clearInterval(eqTimer);
});
</script>

<template>
  <footer class="bg-theme-bg border-t-2 border-theme-border px-2 sm:px-3 py-1.5 shrink-0 select-none z-30 font-mono text-xs">
    <!-- Curses Console Top Header -->
    <div class="flex items-center justify-between text-[10px] text-theme-text-dim pb-1 border-b border-theme-border-subtle mb-1.5 gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-theme-accent font-extrabold truncate">{{ t('player.consoleTitle') }}</span>
        <span v-if="playerState.isPlaying" class="hidden sm:inline text-theme-success font-bold shrink-0">
          [EQ: {{ eqBars[eqFrame] }}]
        </span>
        <span v-else class="hidden sm:inline text-theme-text-dim shrink-0">{{ t('player.paused') }}</span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button 
          @click="showAsciiArt = !showAsciiArt" 
          class="text-[9px] px-1 bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim transition-colors cursor-pointer"
        >
          [{{ showAsciiArt ? 'COVER: PHOTO' : 'COVER: ASCII' }}]
        </button>
        <span class="hidden sm:inline text-theme-text-dim">──┐</span>
      </div>
    </div>

    <!-- Main Console Grid: 2-row responsive on mobile, 3-column on md+ -->
    <div class="grid grid-cols-[1fr_auto] md:flex md:items-center md:justify-between gap-2 md:gap-3">
      <!-- LEFT: Track Metadata & Cover Thumbnail -->
      <div class="col-span-1 order-1 flex items-center gap-2 md:gap-2.5 min-w-0 md:w-1/4 md:min-w-[220px]">
        <!-- Cover Art or ASCII Cassette -->
        <div 
          @click="navigateToAlbum"
          class="w-10 h-10 md:w-12 md:h-12 bg-theme-card border border-theme-border shrink-0 overflow-hidden cursor-pointer relative"
        >
          <!-- ASCII Cassette Mode -->
          <div v-if="showAsciiArt" class="w-full h-full flex flex-col items-center justify-center text-[7px] text-theme-success font-bold leading-none bg-theme-panel">
            <span>.-----.</span>
            <span>|{{ playerState.isPlaying && (eqFrame % 2 === 0) ? '(o) (o)' : '(O) (O)' }}|</span>
            <span>`====='</span>
          </div>

          <!-- Real Image Mode -->
          <img
            v-else-if="playerState.currentTrack"
            :src="`/api/cover/${playerState.currentTrack.albumId}`"
            :alt="playerState.currentTrack.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-theme-text-dim">
            <Disc3 class="w-6 h-6" />
          </div>
        </div>

        <div v-if="playerState.currentTrack" class="min-w-0 pr-1 flex-1">
          <div class="flex items-center gap-1">
            <span class="text-theme-success text-[10px]">{{ playerState.isPlaying ? '▶' : '❚❚' }}</span>
            <p class="text-xs font-bold text-theme-highlight truncate" :title="playerState.currentTrack.title">
              {{ playerState.currentTrack.title }}
            </p>
          </div>
          <p 
            @click="navigateToAlbum"
            class="text-[10px] text-theme-accent truncate hover:underline cursor-pointer"
            :title="playerState.currentTrack.artistName"
          >
            &gt; {{ playerState.currentTrack.artistName }}
          </p>
        </div>

        <!-- Favorite Button -->
        <button
          v-if="playerState.currentTrack"
          type="button"
          @click="toggleFavorite('track', playerState.currentTrack.id)"
          class="px-1.5 py-1 md:px-1 md:py-0 text-xs border border-theme-border-dim hover:border-theme-danger shrink-0 transition-colors cursor-pointer"
          :class="isFavorite('track', playerState.currentTrack.id) ? 'bg-theme-panel text-theme-danger border-theme-danger' : 'text-theme-text-dim'"
          :title="isFavorite('track', playerState.currentTrack.id) ? t('favorites.removeFromFavorites') : 'Add to favorites'"
        >
          <span>{{ isFavorite('track', playerState.currentTrack.id) ? '[★]' : '[☆]' }}</span>
        </button>
        <div v-else class="min-w-0">
          <p class="text-[10px] text-theme-text-dim truncate">&gt; {{ t('player.noTrack').toUpperCase() }}</p>
        </div>
      </div>

      <!-- CENTER: Controls & Dual Scrubber -->
      <div class="col-span-2 order-3 md:order-2 flex flex-col items-center gap-1.5 md:gap-1 w-full md:w-2/4 md:max-w-xl">
        <div class="flex items-center justify-center gap-1 sm:gap-1.5 text-xs w-full">
          <!-- Shuffle -->
          <button
            @click="playerActions.toggleShuffle()"
            class="px-1.5 py-1 md:py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.shuffle ? 'bg-theme-highlight text-black border-theme-highlight' : 'text-theme-text-dim border-theme-border-dim hover:border-theme-accent'"
            title="Shuffle playback"
          >
            <span class="sm:hidden">[⇄]</span>
            <span class="hidden sm:inline">[⇄ {{ t('player.shuffle') }}]</span>
          </button>

          <!-- Previous -->
          <button
            @click="playerActions.prev()"
            class="px-2.5 sm:px-2 py-1 md:py-0.5 text-[11px] font-bold bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim transition-colors cursor-pointer"
            title="Previous (P)"
          >
            <span>[&lt;&lt;]</span>
          </button>

          <!-- Play / Pause -->
          <button
            @click="playerActions.togglePlay()"
            class="px-3 sm:px-4 py-1 md:py-0.5 text-xs font-extrabold border-2 transition-all cursor-pointer"
            :class="playerState.isPlaying ? 'bg-theme-highlight text-black border-theme-highlight' : 'bg-theme-success text-black border-theme-success'"
            :title="playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
          >
            <span v-if="playerState.isPlaying">[ ❚❚ PAUSE ]</span>
            <span v-else>[ ▶ PLAY ]</span>
          </button>

          <!-- Next -->
          <button
            @click="playerActions.next()"
            class="px-2.5 sm:px-2 py-1 md:py-0.5 text-[11px] font-bold bg-theme-panel hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim transition-colors cursor-pointer"
            title="Next (N)"
          >
            <span>[&gt;&gt;]</span>
          </button>

          <!-- Repeat Mode -->
          <button
            @click="playerActions.toggleRepeat()"
            class="px-1.5 py-1 md:py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.repeatMode !== 'off' ? 'bg-theme-highlight text-black border-theme-highlight' : 'text-theme-text-dim border-theme-border-dim hover:border-theme-accent'"
            :title="`Repeat: ${playerState.repeatMode}`"
          >
            <span class="sm:hidden">[↻{{ playerState.repeatMode === 'one' ? '1' : playerState.repeatMode === 'all' ? 'A' : '' }}]</span>
            <span class="hidden sm:inline">[↻ {{ playerState.repeatMode.toUpperCase() }}]</span>
          </button>
        </div>

        <!-- Time & Scrubber row -->
        <div class="flex items-center gap-2 w-full">
          <span class="text-[10px] font-bold text-theme-highlight w-9 sm:w-10 text-right tabular-nums shrink-0">
            {{ formatTime(playerState.currentTime) }}
          </span>

          <div class="flex-1 flex flex-col items-center min-w-0">
            <input
              type="range"
              min="0"
              :max="playerState.duration || 100"
              :value="playerState.currentTime"
              @input="handleSeek"
              class="w-full h-1.5 cursor-pointer"
            />
            <div class="hidden md:flex w-full justify-between text-[8px] text-theme-accent/70 font-mono tracking-tighter mt-0.5">
              <span>[{{ asciiBar }}]</span>
              <span class="text-theme-text-dim">{{ Math.round((playerState.currentTime / (playerState.duration || 1)) * 100) }}%</span>
            </div>
          </div>

          <span class="text-[10px] text-theme-text-dim w-9 sm:w-10 text-left tabular-nums shrink-0">
            {{ formatTime(playerState.duration) }}
          </span>
        </div>
      </div>

      <!-- RIGHT: Controls (Rate, Volume, Queue) -->
      <div class="col-span-1 order-2 md:order-3 flex items-center justify-end gap-1.5 md:gap-2 md:w-1/4 md:min-w-[220px] relative">
        <!-- Playback Rate -->
        <div class="relative">
          <button
            @click.stop="isSpeedMenuOpen = !isSpeedMenuOpen"
            class="px-1.5 py-1 md:py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.playbackRate !== 1.0 ? 'bg-theme-highlight text-black border-theme-highlight' : 'text-theme-text border-theme-border-dim hover:border-theme-accent'"
            title="Playback speed"
          >
            <span>[{{ playerState.playbackRate }}x]</span>
          </button>

          <!-- Popover Menu -->
          <div
            v-if="isSpeedMenuOpen"
            @click.stop
            class="absolute bottom-10 right-0 w-44 bg-theme-bg border-2 border-theme-border p-2 z-50 text-xs space-y-1.5 select-none shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          >
            <div class="flex items-center justify-between pb-1 border-b border-theme-border-dim text-[10px] text-theme-accent font-bold">
              <span>┌──[ {{ t('player.speed') }} ]</span>
              <button @click="isSpeedMenuOpen = false" class="text-theme-text-dim hover:text-theme-danger">[X]─┐</button>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="speed in speedPresets"
                :key="speed"
                @click="selectSpeed(speed)"
                class="py-1 text-[10px] font-bold border transition-colors cursor-pointer"
                :class="playerState.playbackRate === speed ? 'bg-theme-highlight text-black border-theme-highlight' : 'bg-theme-panel text-theme-accent border-theme-border-dim hover:border-theme-accent'"
              >
                {{ speed }}x
              </button>
            </div>
          </div>
        </div>

        <!-- Volume Bar (desktop only, hardware volume on mobile) -->
        <div class="hidden md:flex items-center gap-1 border border-theme-border-dim px-1.5 py-0.5 bg-theme-bg">
          <span class="text-[9px] text-theme-accent font-bold">{{ t('player.volume') }}:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="playerState.volume"
            @input="handleVolume"
            class="w-14 h-1 cursor-pointer"
            title="Volume"
          />
          <span class="text-[9px] text-theme-highlight tabular-nums w-6 text-right">
            {{ Math.round(playerState.volume * 100) }}%
          </span>
        </div>

        <!-- Queue Drawer Button -->
        <button
          @click="playerState.isQueueOpen = !playerState.isQueueOpen"
          class="px-1.5 py-1 md:py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
          :class="playerState.isQueueOpen ? 'bg-theme-accent text-theme-accent-contrast border-theme-accent' : 'text-theme-text border-theme-border-dim hover:border-theme-accent'"
          title="Show / Hide queue (Q)"
        >
          <span>[Q: {{ playerState.queue.length }}]</span>
        </button>
      </div>
    </div>
  </footer>
</template>
