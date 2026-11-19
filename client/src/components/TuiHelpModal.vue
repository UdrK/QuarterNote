<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 font-mono select-none">
    <div class="bg-black border-2 border-[#00ffff] w-full max-w-2xl shadow-[0_0_30px_rgba(0,255,255,0.25)] flex flex-col">
      <!-- Title Bar -->
      <div class="flex items-center justify-between px-3 py-1 bg-[#002b4d] border-b border-[#00ffff] text-[#ffff00] text-xs font-bold">
        <span>╔═[ GUIDA RAPIDA - COMANDI DA TASTIERA TUI ]</span>
        <button @click="emit('close')" class="text-[#00ffff] hover:text-[#ff3366] cursor-pointer">
          [X CHIUDI]═╗
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4 text-xs text-[#d4d4d4] overflow-y-auto max-h-[80vh]">
        <!-- ASCII Banner -->
        <div class="flex justify-center overflow-x-auto py-1">
          <pre class="text-[#00ffff] text-[10px] leading-none font-mono text-left inline-block select-none font-bold" style="font-family: 'Consolas', 'Courier New', Monaco, monospace;">
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
        <div class="border border-[#2a2a2a] p-3 bg-[#070707] space-y-2">
          <div class="text-[#ffff00] font-bold border-b border-[#222222] pb-1 text-[11px]">
            ■ SCORCIATOIE DA TASTIERA GLOBALI:
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F1] o [?]</span>
              <span class="text-[#aaaaaa]">Mostra questo aiuto</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F2] o [1]</span>
              <span class="text-[#aaaaaa]">Directory Artisti</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F3] o [2]</span>
              <span class="text-[#aaaaaa]">Catalogo Album</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F4] o [3]</span>
              <span class="text-[#aaaaaa]">Archivio Preferiti</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F5] o [4]</span>
              <span class="text-[#aaaaaa]">Elenco Playlist</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ffff] font-bold">[F6] o [5]</span>
              <span class="text-[#aaaaaa]">Configurazione Sistema</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#ffff00] font-bold">[Space]</span>
              <span class="text-[#aaaaaa]">Play / Pausa audio</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#ffff00] font-bold">[N] / [P]</span>
              <span class="text-[#aaaaaa]">Brano successivo / prec.</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ff66] font-bold">[/]</span>
              <span class="text-[#aaaaaa]">Cerca nella libreria</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#ff00aa] font-bold">[Q]</span>
              <span class="text-[#aaaaaa]">Apri / Chiudi Coda</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#00ff66] font-bold">[C]</span>
              <span class="text-[#aaaaaa]">Attiva/Disattiva CRT</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#ff3366] font-bold">[ESC]</span>
              <span class="text-[#aaaaaa]">Chiudi finestre / Annulla</span>
            </div>
          </div>
        </div>

        <div class="text-[10px] text-[#777777] text-center">
          * I tasti di scelta rapida funzionano ovunque tranne quando stai digitando in un campo di testo.
        </div>
      </div>

      <!-- Footer -->
      <div class="p-2 bg-[#0a0a0a] border-t border-[#222222] text-center">
        <button
          @click="emit('close')"
          class="bbs-btn bbs-btn-yellow py-1 px-4 text-xs font-bold"
        >
          [ PREMI ESC O CLICCA QUI PER CONTINUARE ]
        </button>
      </div>
    </div>
  </div>
</template>
