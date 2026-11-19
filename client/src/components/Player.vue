<script setup lang="ts">
import { ref, computed } from 'vue';
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
  Disc3,
  Heart
} from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
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

// ASCII visual progress bar calculation
const asciiBar = computed(() => {
  const total = playerState.duration || 1;
  const current = playerState.currentTime || 0;
  const barLength = 22;
  const filled = Math.min(barLength, Math.max(0, Math.round((current / total) * barLength)));
  const empty = barLength - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
});
</script>

<template>
  <footer class="h-22 bg-[#050505] border-t-2 border-[#00ffff]/80 px-4 py-2 flex items-center justify-between shrink-0 select-none z-30 font-mono">
    <!-- LEFT: Currently Playing Track Info in ANSI terminal frame -->
    <div class="flex items-center gap-3 w-1/4 min-w-[220px]">
      <div 
        @click="navigateToAlbum"
        class="w-12 h-12 bg-black border border-[#00ffff] shrink-0 overflow-hidden cursor-pointer relative group"
      >
        <img
          v-if="playerState.currentTrack"
          :src="`/api/cover/${playerState.currentTrack.albumId}`"
          :alt="playerState.currentTrack.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-[#555555]">
          <Disc3 class="w-6 h-6" />
        </div>
        <div class="absolute bottom-0 right-0 bg-black/80 text-[8px] text-[#00ffff] px-0.5 leading-none">
          IMG
        </div>
      </div>

      <div v-if="playerState.currentTrack" class="min-w-0 pr-1 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="text-[#00ff66] text-[10px] animate-pulse">▶</span>
          <p class="text-xs font-bold text-[#ffff00] truncate" :title="playerState.currentTrack.title">
            {{ playerState.currentTrack.title }}
          </p>
        </div>
        <p 
          @click="navigateToAlbum"
          class="text-[11px] text-[#00ffff] truncate hover:underline cursor-pointer transition-colors"
          :title="playerState.currentTrack.artistName"
        >
          &gt; {{ playerState.currentTrack.artistName }}
        </p>
      </div>

      <!-- Favorite Current Track Button -->
      <button
        v-if="playerState.currentTrack"
        type="button"
        @click="toggleFavorite('track', playerState.currentTrack.id)"
        class="px-1.5 py-1 text-xs border border-[#333333] hover:border-[#ff3366] shrink-0 transition-colors"
        :class="isFavorite('track', playerState.currentTrack.id) ? 'bg-[#330011] text-[#ff3366] border-[#ff3366]' : 'text-[#666666]'"
        :title="isFavorite('track', playerState.currentTrack.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
      >
        <span>{{ isFavorite('track', playerState.currentTrack.id) ? '[★]' : '[☆]' }}</span>
      </button>
      <div v-else class="min-w-0">
        <p class="text-[11px] text-[#666666]">&gt; NESSUN BRANO ATTIVO</p>
      </div>
    </div>

    <!-- CENTER: Playback Controls & Retro ASCII Scrubber -->
    <div class="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
      <!-- Buttons row in BBS bracketed style -->
      <div class="flex items-center gap-2 text-xs">
        <!-- Shuffle -->
        <button
          @click="playerActions.toggleShuffle()"
          class="bbs-btn py-0.5 px-2 text-[10px]"
          :class="playerState.shuffle ? 'bbs-btn-yellow border-[#ffff00]' : 'text-[#666666] border-[#333333]'"
          title="Riproduzione casuale"
        >
          <span>[⇄ CAS: {{ playerState.shuffle ? 'ON' : 'OFF' }}]</span>
        </button>

        <!-- Previous -->
        <button
          @click="playerActions.prev()"
          class="bbs-btn py-0.5 px-2.5 text-xs border-[#333333]"
          title="Precedente"
        >
          <span>[&lt;&lt;]</span>
        </button>

        <!-- Play / Pause -->
        <button
          @click="playerActions.togglePlay()"
          class="bbs-btn py-1 px-4 text-xs font-bold border-2"
          :class="playerState.isPlaying ? 'bbs-btn-yellow border-[#ffff00]' : 'bbs-btn-green border-[#00ff66]'"
          :title="playerState.isPlaying ? 'Pausa' : 'Riproduci'"
        >
          <span v-if="playerState.isPlaying">[ ❚❚ PAUSA ]</span>
          <span v-else>[ ▶ PLAY ]</span>
        </button>

        <!-- Next -->
        <button
          @click="playerActions.next()"
          class="bbs-btn py-0.5 px-2.5 text-xs border-[#333333]"
          title="Successivo"
        >
          <span>[&gt;&gt;]</span>
        </button>

        <!-- Repeat Mode -->
        <button
          @click="playerActions.toggleRepeat()"
          class="bbs-btn py-0.5 px-2 text-[10px]"
          :class="playerState.repeatMode !== 'off' ? 'bbs-btn-yellow border-[#ffff00]' : 'text-[#666666] border-[#333333]'"
          :title="`Ripeti: ${playerState.repeatMode}`"
        >
          <span>[↻ REP: {{ playerState.repeatMode.toUpperCase() }}]</span>
        </button>
      </div>

      <!-- Time & ASCII Scrubber Row -->
      <div class="flex items-center gap-3 w-full">
        <span class="text-[11px] font-mono text-[#ffff00] w-12 text-right tabular-nums">
          {{ formatTime(playerState.currentTime) }}
        </span>

        <!-- Interactive Range Slider with ASCII gauge feel -->
        <div class="flex-1 flex flex-col items-center">
          <input
            type="range"
            min="0"
            :max="playerState.duration || 100"
            :value="playerState.currentTime"
            @input="handleSeek"
            class="w-full h-2 cursor-pointer"
          />
          <div class="w-full flex justify-between text-[9px] text-[#00ffff]/60 font-mono tracking-tighter mt-0.5">
            <span>[{{ asciiBar }}]</span>
            <span class="text-[#777777] hidden sm:inline">TRACK SEEK</span>
          </div>
        </div>

        <span class="text-[11px] font-mono text-[#888888] w-12 text-left tabular-nums">
          {{ formatTime(playerState.duration) }}
        </span>
      </div>
    </div>

    <!-- RIGHT: Speed Selector (Rallentatore), Volume, Queue -->
    <div class="flex items-center justify-end gap-2.5 w-1/4 min-w-[220px] relative">
      <!-- SPEED SELECTOR (Rallentatore) -->
      <div class="relative">
        <button
          @click.stop="isSpeedMenuOpen = !isSpeedMenuOpen"
          class="bbs-btn py-0.5 px-2 text-[10px]"
          :class="playerState.playbackRate !== 1.0 ? 'bbs-btn-yellow border-[#ffff00]' : 'border-[#333333] text-[#aaaaaa]'"
          title="Velocità di riproduzione"
        >
          <Gauge class="w-3 h-3" />
          <span>[{{ playerState.playbackRate }}x]</span>
        </button>

        <!-- Speed Dropdown Popover in BBS box -->
        <div
          v-if="isSpeedMenuOpen"
          @click.stop
          class="absolute bottom-12 right-0 w-44 bg-black border border-[#00ffff] p-2 z-50 text-xs space-y-2 select-none shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        >
          <div class="flex items-center justify-between pb-1 border-b border-[#2a2a2a] text-[10px] text-[#00ffff] font-bold">
            <span>■ VELOCITÀ AUDIO</span>
            <button @click="isSpeedMenuOpen = false" class="text-[#888888] hover:text-[#ff3366]">[X]</button>
          </div>

          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="speed in speedPresets"
              :key="speed"
              @click="selectSpeed(speed)"
              class="bbs-btn py-1 text-[10px]"
              :class="playerState.playbackRate === speed ? 'bbs-btn-yellow' : 'border-[#222222] text-[#aaaaaa]'"
            >
              {{ speed }}x
            </button>
          </div>
        </div>
      </div>

      <!-- Volume Scrubber -->
      <div class="flex items-center gap-1.5 border border-[#222222] px-2 py-0.5 bg-black">
        <Volume2 class="w-3.5 h-3.5 text-[#00ffff]" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="playerState.volume"
          @input="handleVolume"
          class="w-16 h-1.5 cursor-pointer"
          title="Volume"
        />
        <span class="text-[10px] text-[#ffff00] tabular-nums w-7 text-right">
          {{ Math.round(playerState.volume * 100) }}%
        </span>
      </div>

      <!-- Queue Drawer Toggle -->
      <button
        @click="playerState.isQueueOpen = !playerState.isQueueOpen"
        class="bbs-btn py-0.5 px-2 text-[10px]"
        :class="playerState.isQueueOpen ? 'bbs-btn-cyan border-[#00ffff]' : 'border-[#333333] text-[#aaaaaa]'"
        title="Visualizza coda di riproduzione"
      >
        <ListMusic class="w-3.5 h-3.5" />
        <span>[{{ playerState.queue.length }}]</span>
      </button>
    </div>
  </footer>
</template>
