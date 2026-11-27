<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { RefreshCw } from '@lucide/vue';
import { triggerScan, fetchScanStatus } from '../api/client';
import type { ScanStatus } from '@quarter-note/shared';
import { t } from '../i18n';

const props = defineProps<{
  mobileOpen?: boolean;
  crtMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'closeMobile'): void;
  (e: 'toggleCrt'): void;
}>();

const route = useRoute();

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

const navLinks = computed(() => [
  { id: '1', key: 'F2', nameKey: 'nav.artists', path: '/artists' },
  { id: '2', key: 'F3', nameKey: 'nav.albums', path: '/albums' },
  { id: '3', key: 'F4', nameKey: 'nav.favorites', path: '/favorites' },
  { id: '4', key: 'F5', nameKey: 'nav.playlists', path: '/playlists' },
  { id: '5', key: 'F6', nameKey: 'nav.config', path: '/settings' },
]);
</script>

<template>
  <!-- Mobile Drawer Backdrop -->
  <div
    v-if="props.mobileOpen"
    @click="emit('closeMobile')"
    class="fixed inset-0 bg-black/75 z-30 md:hidden"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 ease-out md:static md:translate-x-0 md:w-60 md:z-auto bg-theme-bg border-r border-theme-border/40 flex flex-col justify-between shrink-0 select-none font-mono text-xs overflow-y-auto"
    :class="props.mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Top System Banner & Menu -->
    <div class="p-2 space-y-2">
      <!-- Curses Window Header Box -->
      <div class="border border-theme-border bg-theme-panel p-2">
        <div class="text-[10px] text-theme-success font-bold flex items-center justify-between">
          <span>{{ t('nav.scanStatus') }}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-theme-highlight">v2.0</span>
            <button
              @click="emit('closeMobile')"
              class="md:hidden text-theme-accent hover:text-theme-danger font-bold px-1 border border-theme-border-dim"
              title="Close"
            >
              [X]
            </button>
          </div>
        </div>
        <div class="text-xs text-theme-accent font-extrabold mt-0.5 tracking-tight">
          {{ t('nav.audioHeader') }}
        </div>
        <div class="text-[9px] text-theme-text-dim mt-0.5">
          {{ t('nav.term') }}
        </div>
      </div>

      <!-- Navigation Section Header -->
      <div class="px-1 text-[10px] text-theme-text-dim font-bold flex items-center justify-between border-b border-theme-border-subtle pb-0.5">
        <span>{{ t('nav.navHeader') }}</span>
      </div>

      <!-- Nav Links with Inverted Video Selection -->
      <nav class="space-y-1">
        <RouterLink
          v-for="item in navLinks"
          :key="item.path"
          :to="item.path"
          @click="emit('closeMobile')"
          class="flex items-center justify-between px-2 py-2 md:py-1 text-xs font-bold transition-all cursor-pointer border group"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-theme-accent text-theme-accent-contrast border-theme-accent'
              : 'text-theme-text border-transparent hover:bg-theme-active-bg hover:text-white hover:border-theme-border/50'
          ]"
        >
          <div class="flex items-center gap-1.5 truncate">
            <span v-if="route.path.startsWith(item.path)" class="text-theme-accent-contrast font-extrabold">►</span>
            <span v-else class="text-theme-border-dim group-hover:text-white"> </span>
            <span class="truncate">{{ item.id }}. [{{ t(item.nameKey) }}]</span>
          </div>

          <span 
            class="text-[9px] px-1 font-bold shrink-0 ml-1"
            :class="route.path.startsWith(item.path) ? 'bg-theme-bg text-theme-accent' : 'bg-theme-card text-theme-text-dim group-hover:text-white group-hover:bg-theme-panel'"
          >
            {{ item.key }}
          </span>
        </RouterLink>
      </nav>
    </div>

    <!-- Scanner / Bottom Curses Box -->
    <div class="p-2 border-t border-theme-border-subtle bg-theme-panel space-y-2">
      <div class="border border-theme-border-dim p-2 bg-theme-bg">
        <div class="flex items-center justify-between text-[10px] font-bold text-theme-text-dim pb-1 border-b border-theme-border-subtle">
          <span class="text-theme-accent">┌─[ SCANNER ]</span>
          <span class="text-theme-success" v-if="scanStatus.isScanning">[ACTIVE]─┐</span>
          <span class="text-theme-text-dim" v-else>[IDLE]─┐</span>
        </div>

        <div v-if="scanStatus.isScanning" class="space-y-1 mt-1.5">
          <div class="flex items-center justify-between text-[10px] text-theme-text">
            <span>Scanned:</span>
            <span class="text-theme-highlight font-bold">{{ scanStatus.scannedFiles }}/{{ scanStatus.totalFiles }}</span>
          </div>
          <!-- ASCII Progress Bar -->
          <div class="w-full bg-theme-card border border-theme-border-dim h-2">
            <div 
              class="bg-theme-success h-full transition-all duration-200"
              :style="{ width: `${scanStatus.totalFiles ? (scanStatus.scannedFiles / scanStatus.totalFiles) * 100 : 0}%` }"
            />
          </div>
          <p v-if="scanStatus.currentFile" class="text-[9px] text-theme-text-dim truncate" :title="scanStatus.currentFile">
            &gt; {{ scanStatus.currentFile }}
          </p>
        </div>

        <div v-else class="text-[9px] text-theme-text-dim mt-1 flex items-center justify-between">
          <span>Status: READY</span>
          <span class="text-theme-success">● OK</span>
        </div>
      </div>

      <button
        @click="handleScan"
        :disabled="scanStatus.isScanning"
        class="w-full bg-theme-card hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border/40 py-1.5 md:py-1 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': scanStatus.isScanning }" />
        <span>{{ scanStatus.isScanning ? t('nav.scanning') : t('nav.rescan') }}</span>
      </button>

      <!-- Mobile CRT Toggle -->
      <button
        @click="emit('toggleCrt')"
        class="md:hidden w-full bg-theme-bg hover:bg-theme-active-bg text-theme-success border border-theme-border-dim py-1.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>[{{ t('footer.crt') }}: {{ props.crtMode ? 'ON' : 'OFF' }}]</span>
      </button>
    </div>
  </aside>
</template>
