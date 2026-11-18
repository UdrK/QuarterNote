<script setup lang="ts">
import { X, Trash2, ArrowUp, ArrowDown, Play, Disc3 } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';

function close() {
  playerState.isQueueOpen = false;
}
</script>

<template>
  <aside
    v-if="playerState.isQueueOpen"
    class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none z-20 shadow-2xl transition-all"
  >
    <!-- Header -->
    <div class="h-12 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <h2 class="text-xs font-bold text-slate-100 uppercase tracking-wider">Coda</h2>
        <span class="text-xs text-slate-500 font-mono">({{ playerState.queue.length }})</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="playerState.queue.length > 0"
          @click="playerActions.clearQueue()"
          class="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors"
          title="Svuota coda"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
        <button
          @click="close"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          title="Chiudi pannello coda"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Queue List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-if="playerState.queue.length === 0"
        class="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs italic"
      >
        <Disc3 class="w-8 h-8 mb-2 opacity-40" />
        La coda è vuota.<br />Aggiungi dei brani per iniziare!
      </div>

      <div
        v-for="(track, index) in playerState.queue"
        :key="`${track.id}-${index}`"
        class="group flex items-center justify-between p-2 rounded-lg text-xs transition-all"
        :class="[
          index === playerState.queueIndex
            ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
            : 'hover:bg-slate-800/60 text-slate-300'
        ]"
      >
        <!-- Track click to play -->
        <div 
          @click="playerActions.playTrack(track)" 
          class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <span class="w-5 text-center text-[10px] font-mono text-slate-500 group-hover:hidden">
            {{ index + 1 }}
          </span>
          <span class="w-5 hidden group-hover:flex items-center justify-center text-sky-400">
            <Play class="w-3 h-3 fill-current" />
          </span>

          <div class="min-w-0 flex-1">
            <p class="font-medium truncate" :class="{ 'font-semibold text-sky-400': index === playerState.queueIndex }">
              {{ track.title }}
            </p>
            <p class="text-[10px] text-slate-400 truncate">{{ track.artistName }}</p>
          </div>
        </div>

        <!-- Duration & Actions -->
        <div class="flex items-center gap-1 shrink-0 ml-2">
          <span class="text-[10px] font-mono text-slate-500 mr-1">
            {{ formatTime(track.duration) }}
          </span>

          <!-- Reorder & Remove (on hover) -->
          <div class="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
            <button
              v-if="index > 0"
              @click.stop="playerActions.moveQueueItem(index, index - 1)"
              class="p-1 text-slate-400 hover:text-slate-100"
              title="Sposta su"
            >
              <ArrowUp class="w-3 h-3" />
            </button>
            <button
              v-if="index < playerState.queue.length - 1"
              @click.stop="playerActions.moveQueueItem(index, index + 1)"
              class="p-1 text-slate-400 hover:text-slate-100"
              title="Sposta giù"
            >
              <ArrowDown class="w-3 h-3" />
            </button>
            <button
              @click.stop="playerActions.removeFromQueue(index)"
              class="p-1 text-slate-400 hover:text-red-400"
              title="Rimuovi dalla coda"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
