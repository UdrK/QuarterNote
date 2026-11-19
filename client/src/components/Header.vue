<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight, Search, X, Monitor } from '@lucide/vue';

const props = defineProps<{
  crtMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleCrt'): void;
}>();

const router = useRouter();
const route = useRoute();

const searchQuery = ref((route.query.q as string) || '');

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
</script>

<template>
  <header class="h-12 border-b border-[#222222] bg-black px-4 flex items-center justify-between shrink-0 select-none font-mono">
    <!-- History navigation buttons -->
    <div class="flex items-center gap-1.5">
      <button 
        @click="router.back()"
        class="bbs-btn py-1 px-2 text-xs border-[#333333] hover:border-[#00ffff]"
        title="Indietro"
      >
        <span>[&lt;]</span>
      </button>
      <button 
        @click="router.forward()"
        class="bbs-btn py-1 px-2 text-xs border-[#333333] hover:border-[#00ffff]"
        title="Avanti"
      >
        <span>[&gt;]</span>
      </button>

      <span class="hidden md:inline-block ml-3 text-[11px] text-[#555555]">
        | NODE: <span class="text-[#00ffff]">DISP.BBS</span> | STATUS: <span class="text-[#00ff66]">ONLINE</span>
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative w-80">
      <div class="flex items-center bg-[#0a0a0a] border border-[#333333] focus-within:border-[#00ffff] px-2 py-1">
        <span class="text-[#00ffff] text-xs font-bold mr-1">&gt;</span>
        <input
          v-model="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="CERCA: brani, album, artisti..."
          class="w-full bg-transparent text-xs text-[#ffff00] placeholder-[#555555] font-mono focus:outline-none"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="text-[#888888] hover:text-[#ff3366] text-xs font-bold ml-1"
        >
          [X]
        </button>
      </div>
    </div>

    <!-- Right Controls: CRT scanlines toggle -->
    <div class="flex items-center gap-2">
      <button
        @click="emit('toggleCrt')"
        class="bbs-btn py-1 px-2.5 text-[11px]"
        :class="props.crtMode ? 'bbs-btn-green' : 'text-[#888888] border-[#333333]'"
        title="Attiva/disattiva effetto monitor CRT"
      >
        <Monitor class="w-3.5 h-3.5" />
        <span>[ CRT: {{ props.crtMode ? 'ON' : 'OFF' }} ]</span>
      </button>
    </div>
  </header>
</template>
