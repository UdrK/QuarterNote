<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  ListMusic, 
  Disc3,
  Heart
} from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import type { PlaybackRate } from '@quarter-note/shared';

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
  <footer class="bg-black border-t-2 border-[#00ffff] px-3 py-1.5 shrink-0 select-none z-30 font-mono text-xs">
    <!-- Curses Console Top Header -->
    <div class="flex items-center justify-between text-[10px] text-[#446688] pb-1 border-b border-[#172533] mb-1.5">
      <div class="flex items-center gap-2">
        <span class="text-[#00ffff] font-extrabold">┌──[ QN-TUI AUDIO CONSOLE ]</span>
        <span v-if="playerState.isPlaying" class="text-[#00ff66] font-bold">
          [EQ: {{ eqBars[eqFrame] }}]
        </span>
        <span v-else class="text-[#666666]">[PAUSED]</span>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="showAsciiArt = !showAsciiArt" 
          class="text-[9px] px-1 bg-[#0f1f2d] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#224466] transition-colors cursor-pointer"
        >
          [{{ showAsciiArt ? 'COVER: PHOTO' : 'COVER: ASCII' }}]
        </button>
        <span class="text-[#446688]">──┐</span>
      </div>
    </div>

    <!-- Main Console Grid: 3 columns -->
    <div class="flex items-center justify-between gap-3">
      <!-- LEFT: Track Metadata & Cover Thumbnail -->
      <div class="flex items-center gap-2.5 w-1/4 min-w-[220px]">
        <!-- Cover Art or ASCII Cassette -->
        <div 
          @click="navigateToAlbum"
          class="w-12 h-12 bg-black border border-[#00ffff] shrink-0 overflow-hidden cursor-pointer relative"
        >
          <!-- ASCII Cassette Mode -->
          <div v-if="showAsciiArt" class="w-full h-full flex flex-col items-center justify-center text-[7px] text-[#00ff66] font-bold leading-none bg-[#02111a]">
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
          <div v-else class="w-full h-full flex items-center justify-center text-[#555555]">
            <Disc3 class="w-6 h-6" />
          </div>
        </div>

        <div v-if="playerState.currentTrack" class="min-w-0 pr-1 flex-1">
          <div class="flex items-center gap-1">
            <span class="text-[#00ff66] text-[10px]">{{ playerState.isPlaying ? '▶' : '❚❚' }}</span>
            <p class="text-xs font-bold text-[#ffff00] truncate" :title="playerState.currentTrack.title">
              {{ playerState.currentTrack.title }}
            </p>
          </div>
          <p 
            @click="navigateToAlbum"
            class="text-[10px] text-[#00ffff] truncate hover:underline cursor-pointer"
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
          class="px-1 text-xs border border-[#223d54] hover:border-[#ff3366] shrink-0 transition-colors cursor-pointer"
          :class="isFavorite('track', playerState.currentTrack.id) ? 'bg-[#330011] text-[#ff3366] border-[#ff3366]' : 'text-[#666666]'"
          :title="isFavorite('track', playerState.currentTrack.id) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <span>{{ isFavorite('track', playerState.currentTrack.id) ? '[★]' : '[☆]' }}</span>
        </button>
        <div v-else class="min-w-0">
          <p class="text-[10px] text-[#556677]">&gt; NO TRACK PLAYING</p>
        </div>
      </div>

      <!-- CENTER: Controls & Dual Scrubber (ASCII + interactive bar) -->
      <div class="flex flex-col items-center gap-1 w-2/4 max-w-xl">
        <!-- Buttons row in true TUI style -->
        <div class="flex items-center gap-1.5 text-xs">
          <!-- Shuffle -->
          <button
            @click="playerActions.toggleShuffle()"
            class="px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.shuffle ? 'bg-[#ffff00] text-black border-[#ffff00]' : 'text-[#888888] border-[#223d54] hover:border-[#00ffff]'"
            title="Shuffle playback"
          >
            <span>[⇄ SHUF]</span>
          </button>

          <!-- Previous -->
          <button
            @click="playerActions.prev()"
            class="px-2 py-0.5 text-[11px] font-bold bg-[#0d1622] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#223d54] transition-colors cursor-pointer"
            title="Previous (P)"
          >
            <span>[&lt;&lt;]</span>
          </button>

          <!-- Play / Pause -->
          <button
            @click="playerActions.togglePlay()"
            class="px-4 py-0.5 text-xs font-extrabold border-2 transition-all cursor-pointer"
            :class="playerState.isPlaying ? 'bg-[#ffff00] text-black border-[#ffff00]' : 'bg-[#00ff66] text-black border-[#00ff66]'"
            :title="playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
          >
            <span v-if="playerState.isPlaying">[ ❚❚ PAUSE ]</span>
            <span v-else>[ ▶ PLAY ]</span>
          </button>

          <!-- Next -->
          <button
            @click="playerActions.next()"
            class="px-2 py-0.5 text-[11px] font-bold bg-[#0d1622] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#223d54] transition-colors cursor-pointer"
            title="Next (N)"
          >
            <span>[&gt;&gt;]</span>
          </button>

          <!-- Repeat Mode -->
          <button
            @click="playerActions.toggleRepeat()"
            class="px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.repeatMode !== 'off' ? 'bg-[#ffff00] text-black border-[#ffff00]' : 'text-[#888888] border-[#223d54] hover:border-[#00ffff]'"
            :title="`Repeat: ${playerState.repeatMode}`"
          >
            <span>[↻ {{ playerState.repeatMode.toUpperCase() }}]</span>
          </button>
        </div>

        <!-- Time & Scrubber row -->
        <div class="flex items-center gap-2 w-full">
          <span class="text-[10px] font-bold text-[#ffff00] w-10 text-right tabular-nums">
            {{ formatTime(playerState.currentTime) }}
          </span>

          <div class="flex-1 flex flex-col items-center">
            <input
              type="range"
              min="0"
              :max="playerState.duration || 100"
              :value="playerState.currentTime"
              @input="handleSeek"
              class="w-full h-1.5 cursor-pointer"
            />
            <div class="w-full flex justify-between text-[8px] text-[#00ffff]/70 font-mono tracking-tighter mt-0.5">
              <span>[{{ asciiBar }}]</span>
              <span class="text-[#556677]">{{ Math.round((playerState.currentTime / (playerState.duration || 1)) * 100) }}%</span>
            </div>
          </div>

          <span class="text-[10px] text-[#888888] w-10 text-left tabular-nums">
            {{ formatTime(playerState.duration) }}
          </span>
        </div>
      </div>

      <!-- RIGHT: Controls (Rate, Volume, Queue) -->
      <div class="flex items-center justify-end gap-2 w-1/4 min-w-[220px] relative">
        <!-- Playback Rate (Rallentatore) -->
        <div class="relative">
          <button
            @click.stop="isSpeedMenuOpen = !isSpeedMenuOpen"
            class="px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
            :class="playerState.playbackRate !== 1.0 ? 'bg-[#ffff00] text-black border-[#ffff00]' : 'text-[#aaaaaa] border-[#223d54] hover:border-[#00ffff]'"
            title="Playback speed"
          >
            <span>[{{ playerState.playbackRate }}x]</span>
          </button>

          <!-- Popover Menu -->
          <div
            v-if="isSpeedMenuOpen"
            @click.stop
            class="absolute bottom-10 right-0 w-44 bg-black border-2 border-[#00ffff] p-2 z-50 text-xs space-y-1.5 select-none shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          >
            <div class="flex items-center justify-between pb-1 border-b border-[#223d54] text-[10px] text-[#00ffff] font-bold">
              <span>┌──[ PLAYBACK RATE ]</span>
              <button @click="isSpeedMenuOpen = false" class="text-[#888888] hover:text-[#ff3366]">[X]─┐</button>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="speed in speedPresets"
                :key="speed"
                @click="selectSpeed(speed)"
                class="py-1 text-[10px] font-bold border transition-colors cursor-pointer"
                :class="playerState.playbackRate === speed ? 'bg-[#ffff00] text-black border-[#ffff00]' : 'bg-[#0d1622] text-[#00ffff] border-[#223d54] hover:border-[#00ffff]'"
              >
                {{ speed }}x
              </button>
            </div>
          </div>
        </div>

        <!-- Volume Bar -->
        <div class="flex items-center gap-1 border border-[#223d54] px-1.5 py-0.5 bg-black">
          <span class="text-[9px] text-[#00ffff] font-bold">VOL:</span>
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
          <span class="text-[9px] text-[#ffff00] tabular-nums w-6 text-right">
            {{ Math.round(playerState.volume * 100) }}%
          </span>
        </div>

        <!-- Queue Drawer Button -->
        <button
          @click="playerState.isQueueOpen = !playerState.isQueueOpen"
          class="px-1.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer"
          :class="playerState.isQueueOpen ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'text-[#aaaaaa] border-[#223d54] hover:border-[#00ffff]'"
          title="Show / Hide queue (Q)"
        >
          <span>[Q: {{ playerState.queue.length }}]</span>
        </button>
      </div>
    </div>
  </footer>
</template>
