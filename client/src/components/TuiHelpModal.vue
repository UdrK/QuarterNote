<script setup lang="ts">
import { t } from '../i18n';

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 font-mono select-none">
    <div class="bg-theme-bg border-2 border-theme-border w-full max-w-2xl shadow-2xl flex flex-col">
      <!-- Title Bar -->
      <div class="flex items-center justify-between px-3 py-1 bg-theme-panel border-b border-theme-border text-theme-highlight text-xs font-bold">
        <span>╔═[ {{ t('help.title') }} ]</span>
        <button @click="emit('close')" class="text-theme-accent hover:text-theme-danger cursor-pointer">
          [X CLOSE]═╗
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4 text-xs text-theme-text overflow-y-auto max-h-[80vh]">
        <!-- ASCII Banner -->
        <div class="flex justify-center overflow-x-auto py-1">
          <pre class="text-theme-accent text-[10px] leading-none font-mono text-left inline-block select-none font-bold" style="font-family: 'Consolas', 'Courier New', Monaco, monospace;">
╔════════════════════════════════════════════════════════════════════════╗
║   ____                   __            _   __      __                  ║
║  / __ \__  ______ ______/ /____  _____/ | / /___  / /____     TUI      ║
║ / / / / / / / __ `/ ___/ __/ _ \/ ___/  |/ / __ \/ __/ _ \    v2.0     ║
║/ /_/ / /_/ / /_/ / /  / /_/  __/ /  / /|  / /_/ / /_/  __/    BBS      ║
║\___\_\__,_/\__,_/_/   \__/\___/_/  /_/ |_/\____/\__/\___/     EDITION  ║
╚════════════════════════════════════════════════════════════════════════╝
          </pre>
        </div>

        <!-- Keybindings Table -->
        <div class="border border-theme-border-dim p-3 bg-theme-panel space-y-2">
          <div class="text-theme-highlight font-bold border-b border-theme-border-subtle pb-1 text-[11px]">
            ■ {{ t('help.globalKeys') }}:
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F1] or [?]</span>
              <span class="text-theme-text-dim">Show this help dialog</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F2] or [1]</span>
              <span class="text-theme-text-dim">Artists Directory</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F3] or [2]</span>
              <span class="text-theme-text-dim">Albums Catalog</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F4] or [3]</span>
              <span class="text-theme-text-dim">Favorites Archive</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F5] or [4]</span>
              <span class="text-theme-text-dim">Playlists List</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-accent font-bold">[F6] or [5]</span>
              <span class="text-theme-text-dim">System Configuration</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-highlight font-bold">[Space]</span>
              <span class="text-theme-text-dim">Play / Pause audio</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-highlight font-bold">[N] / [P]</span>
              <span class="text-theme-text-dim">Next / previous track</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-success font-bold">[/]</span>
              <span class="text-theme-text-dim">Search library</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-danger font-bold">[Q]</span>
              <span class="text-theme-text-dim">Open / Close Queue</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-success font-bold">[C]</span>
              <span class="text-theme-text-dim">Toggle CRT scanlines</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-theme-danger font-bold">[ESC]</span>
              <span class="text-theme-text-dim">Close dialogs / Cancel</span>
            </div>
          </div>
        </div>

        <div class="text-[10px] text-theme-text-dim text-center">
          * Keyboard shortcuts work globally except while typing in a text input.
        </div>
      </div>

      <!-- Footer -->
      <div class="p-2 bg-theme-panel border-t border-theme-border-subtle text-center">
        <button
          @click="emit('close')"
          class="bbs-btn py-1 px-4 text-xs font-bold"
        >
          {{ t('help.close') }}
        </button>
      </div>
    </div>
  </div>
</template>
