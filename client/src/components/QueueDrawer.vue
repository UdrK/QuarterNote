<script setup lang="ts">
import { X, Trash2, Disc3 } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';

function close() {
  playerState.isQueueOpen = false;
}
</script>

<template>
  <aside
    v-if="playerState.isQueueOpen"
    class="w-80 bg-black border-l-2 border-[#00ffff] flex flex-col shrink-0 select-none z-20 shadow-2xl transition-all font-mono"
  >
    <!-- Header -->
    <div class="h-12 px-3 border-b border-[#222222] bg-[#080808] flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-[#00ffff] font-bold text-xs">■ [ CODA DI RIPRODUZIONE ]</span>
        <span class="text-xs text-[#ffff00] font-mono">({{ playerState.queue.length }})</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="playerState.queue.length > 0"
          @click="playerActions.clearQueue()"
          class="bbs-btn py-0.5 px-1.5 text-[10px] bbs-btn-red"
          title="Svuota coda"
        >
          <span>[SVUOTA]</span>
        </button>
        <button
          @click="close"
          class="bbs-btn py-0.5 px-1.5 text-[10px] border-[#333333]"
          title="Chiudi pannello coda"
        >
          <span>[X]</span>
        </button>
      </div>
    </div>

    <!-- Queue List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-if="playerState.queue.length === 0"
        class="h-full flex flex-col items-center justify-center text-center p-4 text-[#666666] text-xs"
      >
        <Disc3 class="w-8 h-8 mb-2 opacity-40 text-[#555555]" />
        &gt; CODA VUOTA &lt;<br />Aggiungi brani per iniziare la riproduzione.
      </div>

      <div
        v-for="(track, index) in playerState.queue"
        :key="`${track.id}-${index}`"
        class="group flex items-center justify-between p-2 text-xs border border-[#1a1a1a] transition-all"
        :class="[
          index === playerState.queueIndex
            ? 'bg-[#002b4d] border-[#00ffff] text-[#ffff00]'
            : 'hover:bg-[#0c0c0c] hover:border-[#333333] text-[#aaaaaa]'
        ]"
      >
        <div 
          @click="playerActions.jumpToQueueIndex(index)"
          class="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
        >
          <span class="text-[10px] text-[#777777] font-mono w-5">
            {{ String(index + 1).padStart(2, '0') }}.
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-bold truncate" :class="index === playerState.queueIndex ? 'text-[#ffff00]' : 'text-[#d4d4d4]'">
              {{ track.title }}
            </p>
            <p class="text-[10px] text-[#00ffff] opacity-80 truncate">{{ track.artistName }}</p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-2">
          <span class="text-[10px] text-[#777777] font-mono tabular-nums">
            {{ formatTime(track.duration) }}
          </span>
          <button
            @click="playerActions.removeFromQueue(index)"
            class="text-[#666666] hover:text-[#ff3366] text-xs font-bold px-1"
            title="Rimuovi"
          >
            [X]
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
