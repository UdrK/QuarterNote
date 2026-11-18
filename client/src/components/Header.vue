<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight, Search, X } from '@lucide/vue';

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
  <header class="h-12 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none">
    <!-- History navigation buttons -->
    <div class="flex items-center gap-1">
      <button 
        @click="router.back()"
        class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        title="Indietro"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <button 
        @click="router.forward()"
        class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        title="Avanti"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative w-80">
      <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        type="text"
        placeholder="Cerca brani, album o artisti..."
        class="w-full bg-slate-800/70 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-7 py-1.5 border border-slate-700/50 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 transition-all"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Empty spacer for balanced layout -->
    <div class="w-16" />
  </header>
</template>
