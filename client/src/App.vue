<script setup lang="ts">
import { onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Player from './components/Player.vue';
import QueueDrawer from './components/QueueDrawer.vue';
import { initFavorites } from './stores/favorites';

onMounted(() => {
  initFavorites();
});
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
    <!-- Left Navigation Sidebar -->
    <Sidebar />

    <!-- Center Content Area -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Top Navigation & Search Header -->
      <Header />

      <!-- Scrollable Main View -->
      <div class="flex-1 flex overflow-hidden">
        <main class="flex-1 overflow-y-auto">
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
