<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Player from './components/Player.vue';
import QueueDrawer from './components/QueueDrawer.vue';
import TuiFooterBar from './components/TuiFooterBar.vue';
import TuiHelpModal from './components/TuiHelpModal.vue';
import { initFavorites } from './stores/favorites';
import { playerActions, playerState } from './stores/player';

const router = useRouter();
const crtMode = ref(false);
const showHelpModal = ref(false);
const isMobileMenuOpen = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

onMounted(() => {
  initFavorites();
  const savedCrt = localStorage.getItem('quarter_note_crt_mode');
  if (savedCrt === 'true') {
    crtMode.value = true;
  }
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

function toggleCrt() {
  crtMode.value = !crtMode.value;
  localStorage.setItem('quarter_note_crt_mode', String(crtMode.value));
}

function focusSearch() {
  headerRef.value?.focusSearch();
}

function handleGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  const isInputActive = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

  // ESC: close modals or blur input
  if (e.key === 'Escape') {
    if (showHelpModal.value) {
      showHelpModal.value = false;
      return;
    }
    if (isMobileMenuOpen.value) {
      isMobileMenuOpen.value = false;
      return;
    }
    if (playerState.isQueueOpen) {
      playerState.isQueueOpen = false;
      return;
    }
    if (isInputActive) {
      target.blur();
      return;
    }
  }

  // If currently typing in an input field, do not hijack typing keys
  if (isInputActive) {
    return;
  }

  // F-Keys
  if (e.key === 'F1' || e.key === '?') {
    e.preventDefault();
    showHelpModal.value = !showHelpModal.value;
  } else if (e.key === 'F2' || e.key === '1') {
    e.preventDefault();
    router.push('/artists');
  } else if (e.key === 'F3' || e.key === '2') {
    e.preventDefault();
    router.push('/albums');
  } else if (e.key === 'F4' || e.key === '3') {
    e.preventDefault();
    router.push('/favorites');
  } else if (e.key === 'F5' || e.key === '4') {
    e.preventDefault();
    router.push('/playlists');
  } else if (e.key === 'F6' || e.key === '5') {
    e.preventDefault();
    router.push('/settings');
  } else if (e.key === ' ') {
    e.preventDefault();
    playerActions.togglePlay();
  } else if (e.key === '/') {
    e.preventDefault();
    focusSearch();
  } else if (e.key === 'q' || e.key === 'Q') {
    e.preventDefault();
    playerState.isQueueOpen = !playerState.isQueueOpen;
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    playerActions.next();
  } else if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    playerActions.prev();
  } else if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    toggleCrt();
  }
}
</script>

<template>
  <div 
    class="flex flex-col h-dvh w-screen overflow-hidden bg-theme-bg text-theme-text font-mono relative"
    :class="{ 'crt-scanlines': crtMode }"
  >
    <!-- Top Navigation & Search Header -->
    <Header 
      ref="headerRef" 
      :crt-mode="crtMode" 
      :mobile-menu-open="isMobileMenuOpen"
      @toggle-crt="toggleCrt" 
      @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen"
      @open-help="showHelpModal = true" 
    />

    <!-- Middle: Sidebar + Main Area + Queue Drawer -->
    <div class="flex-1 min-h-0 flex overflow-hidden relative">
      <!-- Left Navigation Sidebar (drawer on mobile, static on md+) -->
      <Sidebar 
        :mobile-open="isMobileMenuOpen"
        :crt-mode="crtMode"
        @close-mobile="isMobileMenuOpen = false"
        @toggle-crt="toggleCrt"
      />

      <!-- Center Content Area -->
      <div class="flex-1 min-w-0 min-h-0 flex overflow-hidden bg-theme-bg">
        <main class="flex-1 min-w-0 overflow-y-auto bg-theme-bg p-2 md:p-3.5">
          <RouterView />
        </main>

        <!-- Right Slide-over Queue Drawer -->
        <QueueDrawer />
      </div>
    </div>

    <!-- Bottom Audio Player Console -->
    <Player />

    <!-- Bottom Function Key Bar (Norton Commander / ncmpcpp style) -->
    <TuiFooterBar 
      :crt-mode="crtMode" 
      @open-help="showHelpModal = true" 
      @focus-search="focusSearch" 
      @toggle-crt="toggleCrt" 
    />

    <!-- Keyboard Help Modal -->
    <TuiHelpModal 
      v-if="showHelpModal" 
      @close="showHelpModal = false" 
    />
  </div>
</template>
