<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { HelpCircle, Monitor } from '@lucide/vue';

const props = defineProps<{
  crtMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleCrt'): void;
  (e: 'openHelp'): void;
}>();

const router = useRouter();
const route = useRoute();

const searchQuery = ref((route.query.q as string) || '');
const searchInput = ref<HTMLInputElement | null>(null);

// Live digital clock for TUI header
const currentTime = ref('');
let clockTimer: ReturnType<typeof setInterval> | null = null;

function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('it-IT', { hour12: false });
}

onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

watch(() => route.query.q, (newQ) => {
  searchQuery.value = (newQ as string) || '';
});

function handleSearchInput() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } });
  } else if (route.path === '/search') {
    router.push('/albums');
  }
}

function clearSearch() {
  searchQuery.value = '';
  if (route.path === '/search') {
    router.push('/albums');
  }
}

function focusSearch() {
  searchInput.value?.focus();
  searchInput.value?.select();
}

defineExpose({
  focusSearch,
});
</script>

<template>
  <header class="h-10 border-b border-[#00ffff]/60 bg-[#05090f] px-3 flex items-center justify-between shrink-0 select-none font-mono text-xs">
    <!-- Left: History & Window Identifier -->
    <div class="flex items-center gap-1.5">
      <span class="text-[#00ffff] font-extrabold mr-1">┌─[ QN-TUI ]</span>
      <button 
        @click="router.back()"
        class="bg-[#111c26] text-[#00ffff] hover:bg-[#00ffff] hover:text-black px-1.5 py-0.5 border border-[#223d54] text-[11px] font-bold transition-colors cursor-pointer"
        title="Indietro (Alt+Left)"
      >
        &lt;
      </button>
      <button 
        @click="router.forward()"
        class="bg-[#111c26] text-[#00ffff] hover:bg-[#00ffff] hover:text-black px-1.5 py-0.5 border border-[#223d54] text-[11px] font-bold transition-colors cursor-pointer"
        title="Avanti (Alt+Right)"
      >
        &gt;
      </button>

      <span class="hidden md:inline-block ml-2 text-[10px] text-[#446688]">
        ──[ NODE: <span class="text-[#00ff66]">ONLINE</span> ]──
      </span>
    </div>

    <!-- Center: Search Command Line Prompt -->
    <div class="relative w-72 sm:w-88">
      <div class="flex items-center bg-black border border-[#00ffff]/50 focus-within:border-[#ffff00] px-2 py-0.5 shadow-inner">
        <span class="text-[#00ff66] text-xs font-bold mr-1.5">&gt;</span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="CERCA (/ per attivare)..."
          class="w-full bg-transparent text-xs text-[#ffff00] placeholder-[#445566] font-mono focus:outline-none"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="text-[#777777] hover:text-[#ff3366] text-xs font-bold ml-1 cursor-pointer"
        >
          [X]
        </button>
      </div>
    </div>

    <!-- Right: Digital Clock & Help Trigger -->
    <div class="flex items-center gap-2">
      <!-- Digital Clock -->
      <div class="hidden sm:flex items-center text-[11px] text-[#00ffff] bg-[#001726] border border-[#00ffff]/30 px-2 py-0.5">
        <span class="text-[#888888] mr-1">TIME:</span>
        <span class="font-bold tabular-nums text-[#ffff00]">{{ currentTime }}</span>
      </div>

      <!-- F1 Help Trigger Button -->
      <button
        @click="emit('openHelp')"
        class="bg-[#002b4d] text-[#ffff00] border border-[#00ffff] hover:bg-[#ffff00] hover:text-black px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer"
        title="Guida tastiera (F1)"
      >
        <span>[? GUIDA]</span>
      </button>

      <span class="text-[#00ffff] font-extrabold hidden lg:inline">─┐</span>
    </div>
  </header>
</template>
