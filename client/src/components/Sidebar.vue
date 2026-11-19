<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Users, 
  Disc3, 
  Heart, 
  ListMusic, 
  RefreshCw, 
  Settings,
  Terminal
} from '@lucide/vue';
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
  { id: '1', name: 'ARTISTI', path: '/artists', icon: Users },
  { id: '2', name: 'ALBUM', path: '/albums', icon: Disc3 },
  { id: '3', name: 'PREFERITI', path: '/favorites', icon: Heart },
  { id: '4', name: 'PLAYLIST', path: '/playlists', icon: ListMusic },
  { id: '5', name: 'CONFIG', path: '/settings', icon: Settings },
];
</script>

<template>
  <aside class="w-64 bg-black border-r border-[#222222] flex flex-col justify-between shrink-0 select-none font-mono">
    <!-- Brand / Header -->
    <div class="p-3">
      <!-- BBS Banner Box -->
      <div 
        @click="router.push('/')" 
        class="border border-[#00ffff]/60 bg-[#060e14] p-3 mb-4 cursor-pointer hover:border-[#ffff00] hover:bg-[#0f171e] transition-colors"
      >
        <div class="flex items-center justify-between text-[11px] text-[#00ffff] font-bold pb-1 border-b border-[#00ffff]/30">
          <span class="flex items-center gap-1.5">
            <span class="text-[#00ff66]">●</span> QUARTER NOTE
          </span>
          <span class="text-[#ffff00]">v1.0</span>
        </div>
        <div class="mt-2 text-xs text-[#d4d4d4] font-bold">
          [ BBS AUDIO SYSTEM ]
        </div>
        <div class="text-[10px] text-[#888888] tracking-wider mt-0.5">
          SYSOP: ONLINE
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="mb-2 px-1 text-[11px] text-[#888888] font-bold flex items-center justify-between border-b border-[#222222] pb-1">
        <span>─── [ MENU PRINCIPALE ] ───</span>
      </div>

      <nav class="space-y-1">
        <RouterLink
          v-for="item in navLinks"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-between px-2.5 py-1.5 text-xs font-bold transition-all border"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-[#002b4d] text-[#ffff00] border-[#00ffff] font-bold'
              : 'text-[#aaaaaa] border-transparent hover:text-[#00ffff] hover:border-[#333333] hover:bg-[#0c0c0c]'
          ]"
        >
          <div class="flex items-center gap-2">
            <span class="text-[#00ffff]" v-if="route.path.startsWith(item.path)">►</span>
            <span class="text-[#555555]" v-else> </span>
            <span>[{{ item.id }}. {{ item.name }}]</span>
          </div>
          <component :is="item.icon" class="w-3.5 h-3.5 opacity-60" />
        </RouterLink>
      </nav>
    </div>

    <!-- Scanner / Bottom Widget -->
    <div class="p-3 border-t border-[#222222] bg-[#070707] space-y-2.5">
      <div class="border border-[#2a2a2a] p-2 bg-black">
        <div class="flex items-center justify-between text-[11px] font-bold text-[#888888] pb-1 border-b border-[#1f1f1f]">
          <span class="text-[#00ffff]">■ STATO LIBRERIA</span>
          <span class="text-[#00ff66]" v-if="scanStatus.isScanning">SCANNING</span>
          <span class="text-[#888888]" v-else>IDLE</span>
        </div>

        <div v-if="scanStatus.isScanning" class="space-y-1.5 mt-2">
          <div class="flex items-center justify-between text-[10px] text-[#aaaaaa]">
            <span>File letti:</span>
            <span class="text-[#ffff00] font-bold">{{ scanStatus.scannedFiles }} / {{ scanStatus.totalFiles }}</span>
          </div>
          <!-- ASCII Progress Bar -->
          <div class="w-full bg-[#111111] border border-[#333333] h-2.5 overflow-hidden">
            <div 
              class="bg-[#00ffff] h-full transition-all duration-300"
              :style="{ width: `${scanStatus.totalFiles ? (scanStatus.scannedFiles / scanStatus.totalFiles) * 100 : 0}%` }"
            />
          </div>
          <p v-if="scanStatus.currentFile" class="text-[9px] text-[#777777] truncate" :title="scanStatus.currentFile">
            &gt; {{ scanStatus.currentFile }}
          </p>
        </div>

        <div v-else class="text-[10px] text-[#666666] mt-1.5 flex items-center justify-between">
          <span>Database pronto</span>
          <span class="text-[#00ff66]">● OK</span>
        </div>
      </div>

      <button
        @click="handleScan"
        :disabled="scanStatus.isScanning"
        class="w-full bbs-btn text-[11px] py-1.5 border-[#333333] hover:border-[#00ffff]"
      >
        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': scanStatus.isScanning }" />
        <span>{{ scanStatus.isScanning ? '[ IN SCANSIONE... ]' : '[ RISCANSIONA ]' }}</span>
      </button>
    </div>
  </aside>
</template>
