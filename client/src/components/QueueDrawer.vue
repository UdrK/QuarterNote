<script setup lang="ts">
import { Disc3 } from '@lucide/vue';
import { playerState, playerActions, formatTime } from '../stores/player';
import { t } from '../i18n';

function close() {
  playerState.isQueueOpen = false;
}
</script>

<template>
  <aside
    v-if="playerState.isQueueOpen"
    class="w-84 bg-theme-bg border-l-2 border-theme-border flex flex-col shrink-0 select-none z-20 shadow-2xl transition-all font-mono text-xs"
  >
    <!-- Header -->
    <div class="h-9 px-2 border-b border-theme-border/60 bg-theme-panel flex items-center justify-between shrink-0 text-theme-accent">
      <div class="flex items-center gap-1.5 font-bold">
        <span>┌──[ {{ t('queue.title') }} ]</span>
        <span class="text-theme-highlight">({{ playerState.queue.length }})</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="playerState.queue.length > 0"
          @click="playerActions.clearQueue()"
          class="text-[10px] px-1 bg-theme-panel text-theme-danger hover:bg-theme-danger hover:text-black font-bold border border-theme-danger transition-colors cursor-pointer"
          :title="t('queue.clear')"
        >
          [CLEAR]
        </button>
        <button
          @click="close"
          class="text-[10px] px-1 bg-theme-card text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast font-bold border border-theme-border-dim transition-colors cursor-pointer"
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
        class="h-full flex flex-col items-center justify-center text-center p-4 text-theme-text-dim text-xs"
      >
        <Disc3 class="w-8 h-8 mb-2 opacity-30 text-theme-accent" />
        &gt;&gt; {{ t('queue.empty') }} &lt;&lt;
      </div>

      <div
        v-for="(track, index) in playerState.queue"
        :key="`${track.id}-${index}`"
        class="group flex items-center justify-between px-2 py-1 text-xs border transition-colors cursor-pointer"
        :class="[
          index === playerState.queueIndex
            ? 'bg-theme-accent text-theme-accent-contrast font-extrabold border-theme-accent'
            : 'border-theme-border-subtle hover:bg-theme-active-bg hover:text-white text-theme-text'
        ]"
      >
        <div 
          @click="playerActions.jumpToQueueIndex(index)"
          class="flex items-center gap-1.5 min-w-0 flex-1"
        >
          <span 
            class="text-[10px] font-mono w-5 shrink-0"
            :class="index === playerState.queueIndex ? 'text-theme-accent-contrast font-bold' : 'text-theme-text-dim group-hover:text-white'"
          >
            {{ index === playerState.queueIndex ? '►' : String(index + 1).padStart(2, '0') + '.' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-bold truncate" :class="index === playerState.queueIndex ? 'text-theme-accent-contrast' : 'text-theme-text group-hover:text-white'">
              {{ track.title }}
            </p>
            <p 
              class="text-[9px] truncate"
              :class="index === playerState.queueIndex ? 'text-theme-accent-contrast/80' : 'text-theme-accent group-hover:text-white/80'"
            >
              {{ track.artistName }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-1.5">
          <span 
            class="text-[9px] font-mono tabular-nums"
            :class="index === playerState.queueIndex ? 'text-theme-accent-contrast' : 'text-theme-text-dim group-hover:text-white'"
          >
            {{ formatTime(track.duration) }}
          </span>
          <button
            @click.stop="playerActions.removeFromQueue(index)"
            class="text-xs font-bold px-1 transition-colors cursor-pointer"
            :class="index === playerState.queueIndex ? 'text-theme-accent-contrast hover:text-theme-danger' : 'text-theme-text-dim hover:text-theme-danger'"
            title="Remove"
          >
            [X]
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
