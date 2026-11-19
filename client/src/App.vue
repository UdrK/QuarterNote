<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Player from './components/Player.vue';
import QueueDrawer from './components/QueueDrawer.vue';
import { initFavorites } from './stores/favorites';

const crtMode = ref(false);

onMounted(() => {
  initFavorites();
  const savedCrt = localStorage.getItem('quarter_note_crt_mode');
  if (savedCrt === 'true') {
    crtMode.value = true;
  }
});

function toggleCrt() {
  crtMode.value = !crtMode.value;
  localStorage.setItem('quarter_note_crt_mode', String(crtMode.value));
}
</script>

<template>
  <div 
    class="flex h-screen w-screen overflow-hidden bg-black text-[#d4d4d4] font-mono relative"
    :class="{ 'crt-scanlines': crtMode }"
  >
    <!-- Left Navigation Sidebar -->
    <Sidebar />

    <!-- Center Content Area -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black border-l border-[#222222]">
      <!-- Top Navigation & Search Header -->
      <Header :crt-mode="crtMode" @toggle-crt="toggleCrt" />

      <!-- Scrollable Main View -->
      <div class="flex-1 flex overflow-hidden">
        <main class="flex-1 overflow-y-auto bg-black p-5">
          <RouterView />
        </main>

        <!-- Right Slide-over Queue Drawer -->
        <QueueDrawer />
      </div>

      <!-- Bottom Audio Player -->
      <Player />
    </div>
  </div>
</template>
