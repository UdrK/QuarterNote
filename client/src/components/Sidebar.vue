<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RefreshCw } from '@lucide/vue';
import { triggerScan, fetchScanStatus } from '../api/client';
import type { ScanStatus } from '@quarter-note/shared';

const route = useRoute();
const router = useRouter();

const scanStatus = ref<ScanStatus>({
  isScanning: false,
  scannedFiles: 0,
  totalFiles: 0,
});

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function checkStatus() {
  try {
    const status = await fetchScanStatus();
    scanStatus.value = status;
    if (!status.isScanning && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  } catch (err) {
    console.error('Scan status check error:', err);
  }
}

async function handleScan() {
  if (scanStatus.value.isScanning) return;
  try {
    const status = await triggerScan();
    scanStatus.value = status;
    if (!pollTimer) {
      pollTimer = setInterval(checkStatus, 1500);
    }
  } catch (err) {
    console.error('Failed to start scan:', err);
  }
}

onMounted(() => {
  checkStatus();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

const navLinks = [
  { id: '1', key: 'F2', name: 'ARTISTI', path: '/artists' },
  { id: '2', key: 'F3', name: 'ALBUM', path: '/albums' },
  { id: '3', key: 'F4', name: 'PREFERITI', path: '/favorites' },
  { id: '4', key: 'F5', name: 'PLAYLIST', path: '/playlists' },
  { id: '5', key: 'F6', name: 'CONFIG', path: '/settings' },
];
</script>

<template>
  <aside class="w-60 bg-black border-r border-[#00ffff]/40 flex flex-col justify-between shrink-0 select-none font-mono text-xs">
    <!-- Top System Banner & Menu -->
    <div class="p-2 space-y-2">
      <!-- Curses Window Header Box -->
      <div class="border border-[#00ffff] bg-[#001726] p-2">
        <div class="text-[10px] text-[#00ff66] font-bold flex items-center justify-between">
          <span>● QN-TUI BBS</span>
          <span class="text-[#ffff00]">v2.0</span>
        </div>
        <div class="text-xs text-[#00ffff] font-extrabold mt-0.5 tracking-tight">
          ╔═[ CURSES AUDIO ]═╗
        </div>
        <div class="text-[9px] text-[#6688aa] mt-0.5">
          TERM: ANSI 80x25
        </div>
      </div>

      <!-- Navigation Section Header -->
      <div class="px-1 text-[10px] text-[#446688] font-bold flex items-center justify-between border-b border-[#1f2937] pb-0.5">
        <span>┌──[ NAVIGAZIONE ]──┐</span>
      </div>

      <!-- Nav Links with Inverted Video Selection -->
      <nav class="space-y-1">
        <RouterLink
          v-for="item in navLinks"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-between px-2 py-1 text-xs font-bold transition-all cursor-pointer border"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-[#00ffff] text-black border-[#00ffff]'
              : 'text-[#aaaaaa] border-transparent hover:bg-[#002b4d] hover:text-[#ffff00] hover:border-[#00ffff]/50'
          ]"
        >
          <div class="flex items-center gap-1.5 truncate">
            <span v-if="route.path.startsWith(item.path)" class="text-black font-extrabold">►</span>
            <span v-else class="text-[#446688]"> </span>
            <span class="truncate">{{ item.id }}. [{{ item.name }}]</span>
          </div>

          <span 
            class="text-[9px] px-1 font-bold shrink-0 ml-1"
            :class="route.path.startsWith(item.path) ? 'bg-black text-[#00ffff]' : 'bg-[#1a2936] text-[#6688aa]'"
          >
            {{ item.key }}
          </span>
        </RouterLink>
      </nav>
    </div>

    <!-- Scanner / Bottom Curses Box -->
    <div class="p-2 border-t border-[#1f2937] bg-[#05080c] space-y-2">
      <div class="border border-[#223d54] p-2 bg-black">
        <div class="flex items-center justify-between text-[10px] font-bold text-[#888888] pb-1 border-b border-[#172533]">
          <span class="text-[#00ffff]">┌─[ SCANNER ]</span>
          <span class="text-[#00ff66]" v-if="scanStatus.isScanning">[ATTIVO]─┐</span>
          <span class="text-[#6688aa]" v-else>[IDLE]─┐</span>
        </div>

        <div v-if="scanStatus.isScanning" class="space-y-1 mt-1.5">
          <div class="flex items-center justify-between text-[10px] text-[#aaaaaa]">
            <span>Letti:</span>
            <span class="text-[#ffff00] font-bold">{{ scanStatus.scannedFiles }}/{{ scanStatus.totalFiles }}</span>
          </div>
          <!-- ASCII Progress Bar -->
          <div class="w-full bg-[#111] border border-[#333] h-2">
            <div 
              class="bg-[#00ff66] h-full transition-all duration-200"
              :style="{ width: `${scanStatus.totalFiles ? (scanStatus.scannedFiles / scanStatus.totalFiles) * 100 : 0}%` }"
            />
          </div>
          <p v-if="scanStatus.currentFile" class="text-[9px] text-[#556677] truncate" :title="scanStatus.currentFile">
            &gt; {{ scanStatus.currentFile }}
          </p>
        </div>

        <div v-else class="text-[9px] text-[#556677] mt-1 flex items-center justify-between">
          <span>Stato: PRONTO</span>
          <span class="text-[#00ff66]">● OK</span>
        </div>
      </div>

      <button
        @click="handleScan"
        :disabled="scanStatus.isScanning"
        class="w-full bg-[#0a1622] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#00ffff]/40 py-1 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': scanStatus.isScanning }" />
        <span>{{ scanStatus.isScanning ? '[ IN SCANSIONE... ]' : '[ RISCANSIONA LIBRERIA ]' }}</span>
      </button>
    </div>
  </aside>
</template>
