<script setup lang="ts">
import { useRouter } from 'vue-router';
import { playerActions, playerState } from '../stores/player';

const props = defineProps<{
  crtMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'openHelp'): void;
  (e: 'focusSearch'): void;
  (e: 'toggleCrt'): void;
}>();

const router = useRouter();

function handleKeyAction(key: string) {
  switch (key) {
    case 'F1':
      emit('openHelp');
      break;
    case 'F2':
      router.push('/artists');
      break;
    case 'F3':
      router.push('/albums');
      break;
    case 'F4':
      router.push('/favorites');
      break;
    case 'F5':
      router.push('/playlists');
      break;
    case 'F6':
      router.push('/settings');
      break;
    case 'Space':
      playerActions.togglePlay();
      break;
    case '/':
      emit('focusSearch');
      break;
    case 'Q':
      playerState.isQueueOpen = !playerState.isQueueOpen;
      break;
    case 'C':
      emit('toggleCrt');
      break;
  }
}
</script>

<template>
  <footer class="h-6 bg-[#001726] border-t border-[#00ffff]/60 px-2 flex items-center justify-between shrink-0 select-none font-mono text-[11px] overflow-x-auto whitespace-nowrap">
    <div class="flex items-center gap-2">
      <!-- F1 Help -->
      <button 
        @click="handleKeyAction('F1')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F1</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Help</span>
      </button>

      <!-- F2 Artists -->
      <button 
        @click="handleKeyAction('F2')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F2</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Artists</span>
      </button>

      <!-- F3 Albums -->
      <button 
        @click="handleKeyAction('F3')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F3</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Albums</span>
      </button>

      <!-- F4 Favorites -->
      <button 
        @click="handleKeyAction('F4')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F4</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Favorites</span>
      </button>

      <!-- F5 Playlist -->
      <button 
        @click="handleKeyAction('F5')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F5</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Playlists</span>
      </button>

      <!-- F6 Config -->
      <button 
        @click="handleKeyAction('F6')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ffff] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">F6</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Config</span>
      </button>

      <!-- Space Play/Pausa -->
      <button 
        @click="handleKeyAction('Space')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#ffff00] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">Space</span>
        <span class="text-[#ffff00] group-hover:text-[#ffffff]">{{ playerState.isPlaying ? 'Pause' : 'Play' }}</span>
      </button>

      <!-- / Search -->
      <button 
        @click="handleKeyAction('/')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#00ff66] text-black font-extrabold px-1 text-[10px] leading-tight mr-1">/</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Search</span>
      </button>
    </div>

    <!-- Right utility shortcuts -->
    <div class="flex items-center gap-2">
      <!-- Q Queue -->
      <button 
        @click="handleKeyAction('Q')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#ff00aa] text-white font-extrabold px-1 text-[10px] leading-tight mr-1">Q</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">Queue ({{ playerState.queue.length }})</span>
      </button>

      <!-- C CRT -->
      <button 
        @click="handleKeyAction('C')" 
        class="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <span class="bg-[#333333] text-[#00ff66] font-extrabold px-1 text-[10px] leading-tight mr-1">C</span>
        <span class="text-[#cccccc] group-hover:text-[#ffffff]">CRT: {{ props.crtMode ? 'ON' : 'OFF' }}</span>
      </button>
    </div>
  </footer>
</template>
