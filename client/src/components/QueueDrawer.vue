<script setup lang="ts">
import { Disc3 } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';

function close() {
  playerState.isQueueOpen = false;
}
</script>

<template>
  <aside
    v-if="playerState.isQueueOpen"
    class="w-84 bg-black border-l-2 border-[#00ffff] flex flex-col shrink-0 select-none z-20 shadow-2xl transition-all font-mono text-xs"
  >
    <!-- Header -->
    <div class="h-9 px-2 border-b border-[#00ffff]/60 bg-[#001726] flex items-center justify-between shrink-0 text-[#00ffff]">
      <div class="flex items-center gap-1.5 font-bold">
        <span>┌──[ PLAYBACK QUEUE ]</span>
        <span class="text-[#ffff00]">({{ playerState.queue.length }})</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="playerState.queue.length > 0"
          @click="playerActions.clearQueue()"
          class="text-[10px] px-1 bg-[#330011] text-[#ff3366] hover:bg-[#ff3366] hover:text-black font-bold border border-[#661122] transition-colors cursor-pointer"
          title="Clear queue"
        >
          [CLEAR]
        </button>
        <button
          @click="close"
          class="text-[10px] px-1 bg-[#111c26] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-bold border border-[#223d54] transition-colors cursor-pointer"
          title="Close (ESC)"
        >
          [X]─┐
        </button>
      </div>
    </div>

    <!-- Queue List -->
    <div class="flex-1 overflow-y-auto p-1.5 space-y-0.5">
      <div
        v-if="playerState.queue.length === 0"
        class="h-full flex flex-col items-center justify-center text-center p-4 text-[#556677] text-xs"
      >
        <Disc3 class="w-8 h-8 mb-2 opacity-30 text-[#00ffff]" />
        &gt;&gt; QUEUE EMPTY &lt;&lt;<br />Add tracks to get started.
      </div>

      <div
        v-for="(track, index) in playerState.queue"
        :key="`${track.id}-${index}`"
        class="group flex items-center justify-between px-2 py-1 text-xs border transition-colors cursor-pointer"
        :class="[
          index === playerState.queueIndex
            ? 'bg-[#00ffff] text-black font-extrabold border-[#00ffff]'
            : 'border-[#172533] hover:bg-[#002238] hover:text-[#ffff00] text-[#aaaaaa]'
        ]"
      >
        <div 
          @click="playerActions.jumpToQueueIndex(index)"
          class="flex items-center gap-1.5 min-w-0 flex-1"
        >
          <span 
            class="text-[10px] font-mono w-5 shrink-0"
            :class="index === playerState.queueIndex ? 'text-black font-bold' : 'text-[#556677]'"
          >
            {{ index === playerState.queueIndex ? '►' : String(index + 1).padStart(2, '0') + '.' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-bold truncate" :class="index === playerState.queueIndex ? 'text-black' : 'text-[#d4d4d4]'">
              {{ track.title }}
            </p>
            <p 
              class="text-[9px] truncate"
              :class="index === playerState.queueIndex ? 'text-black/80' : 'text-[#00ffff]/80'"
            >
              {{ track.artistName }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-1.5">
          <span 
            class="text-[9px] font-mono tabular-nums"
            :class="index === playerState.queueIndex ? 'text-black' : 'text-[#667788]'"
          >
            {{ formatTime(track.duration) }}
          </span>
          <button
            @click.stop="playerActions.removeFromQueue(index)"
            class="text-xs font-bold px-1 transition-colors cursor-pointer"
            :class="index === playerState.queueIndex ? 'text-black hover:text-[#ff3366]' : 'text-[#667788] hover:text-[#ff3366]'"
            title="Remove"
          >
            [X]
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
