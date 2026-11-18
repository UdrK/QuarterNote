<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Users, 
  Disc3, 
  Music2, 
  ListMusic, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
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
  { name: 'Artisti', path: '/artists', icon: Users },
  { name: 'Album', path: '/albums', icon: Disc3 },
  { name: 'Brani', path: '/tracks', icon: Music2 },
  { name: 'Playlist', path: '/playlists', icon: ListMusic },
];
</script>

<template>
  <aside class="w-60 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
    <!-- Brand / Header -->
    <div class="p-4">
      <div 
        @click="router.push('/albums')" 
        class="flex items-center gap-2.5 cursor-pointer group mb-6 px-2 py-1"
      >
        <div class="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
          ♩
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-100 tracking-tight leading-none group-hover:text-sky-400 transition-colors">
            Quarter Note
          </h1>
          <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Music Streamer</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="space-y-1">
        <RouterLink
          v-for="item in navLinks"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- Scanner / Bottom Widget -->
    <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
      <div v-if="scanStatus.isScanning" class="space-y-2 mb-3">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1.5 text-sky-400 font-medium">
            <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Scansione in corso
          </span>
          <span>{{ scanStatus.scannedFiles }}/{{ scanStatus.totalFiles }}</span>
        </div>
        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            class="bg-sky-500 h-full transition-all duration-300"
            :style="{ width: `${scanStatus.totalFiles ? (scanStatus.scannedFiles / scanStatus.totalFiles) * 100 : 0}%` }"
          />
        </div>
        <p v-if="scanStatus.currentFile" class="text-[11px] text-slate-500 truncate" :title="scanStatus.currentFile">
          {{ scanStatus.currentFile }}
        </p>
      </div>

      <button
        @click="handleScan"
        :disabled="scanStatus.isScanning"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': scanStatus.isScanning }" />
        <span>{{ scanStatus.isScanning ? 'Scansione in corso...' : 'Riscansiona Libreria' }}</span>
      </button>
    </div>
  </aside>
</template>
