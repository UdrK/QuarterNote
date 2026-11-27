<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { t } from '../i18n';

const props = defineProps<{
  crtMode?: boolean;
  mobileMenuOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleCrt'): void;
  (e: 'toggleMenu'): void;
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
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false });
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
  <header class="h-10 border-b border-theme-border/60 bg-theme-panel px-2 sm:px-3 flex items-center justify-between gap-2 shrink-0 select-none font-mono text-xs">
    <!-- Left: Mobile Menu + History & Window Identifier -->
    <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
      <button
        @click="emit('toggleMenu')"
        class="md:hidden bg-theme-card text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast px-2 py-1 border border-theme-border text-[11px] font-bold transition-colors cursor-pointer"
        :aria-label="t('header.menu')"
        :title="t('header.menu')"
      >
        {{ props.mobileMenuOpen ? '[X]' : '[≡]' }}
      </button>

      <span class="hidden sm:inline text-theme-accent font-extrabold mr-1">┌─[ QN-TUI ]</span>
      <button 
        @click="router.back()"
        class="bg-theme-card text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast px-1.5 py-1 sm:py-0.5 border border-theme-border-dim text-[11px] font-bold transition-colors cursor-pointer"
        title="Back (Alt+Left)"
      >
        &lt;
      </button>
      <button 
        @click="router.forward()"
        class="hidden sm:inline-block bg-theme-card text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast px-1.5 py-0.5 border border-theme-border-dim text-[11px] font-bold transition-colors cursor-pointer"
        title="Forward (Alt+Right)"
      >
        &gt;
      </button>

      <span class="hidden md:inline-block ml-2 text-[10px] text-theme-text-dim">
        ──[ NODE: <span class="text-theme-success">ONLINE</span> ]──
      </span>
    </div>

    <!-- Center: Search Command Line Prompt -->
    <div class="relative flex-1 min-w-0 max-w-sm md:w-88 md:flex-initial">
      <div class="flex items-center bg-theme-bg border border-theme-border/50 focus-within:border-theme-highlight px-2 py-1 sm:py-0.5 shadow-inner">
        <span class="text-theme-success text-xs font-bold mr-1.5 shrink-0">&gt;</span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          @input="handleSearchInput"
          type="text"
          :placeholder="t('header.searchPlaceholder')"
          class="w-full min-w-0 bg-transparent text-xs text-theme-highlight placeholder-theme-text-dim/60 font-mono focus:outline-none"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="text-theme-text-dim hover:text-theme-danger text-xs font-bold ml-1 shrink-0 cursor-pointer"
        >
          [X]
        </button>
      </div>
    </div>

    <!-- Right: Digital Clock & Help Trigger -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <!-- Digital Clock -->
      <div class="hidden sm:flex items-center text-[11px] text-theme-accent bg-theme-bg border border-theme-border/30 px-2 py-0.5">
        <span class="text-theme-text-dim mr-1">TIME:</span>
        <span class="font-bold tabular-nums text-theme-highlight">{{ currentTime }}</span>
      </div>

      <!-- F1 Help Trigger Button -->
      <button
        @click="emit('openHelp')"
        class="bg-theme-active-bg text-theme-highlight border border-theme-border hover:bg-theme-highlight hover:text-black px-2 py-1 sm:py-0.5 text-[11px] font-bold transition-colors cursor-pointer"
        title="Keyboard guide (F1)"
      >
        <span class="sm:hidden">[?]</span>
        <span class="hidden sm:inline">{{ t('header.help') }}</span>
      </button>

      <span class="text-theme-accent font-extrabold hidden lg:inline">─┐</span>
    </div>
  </header>
</template>
