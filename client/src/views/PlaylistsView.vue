<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ListMusic, Plus, Trash2, Heart } from '@lucide/vue';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../api/client';
import { formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import type { Playlist } from '@quarter-note/shared';

const router = useRouter();
const playlists = ref<Playlist[]>([]);
const newName = ref('');
const showCreate = ref(false);
const isLoading = ref(true);

async function load() {
  try {
    playlists.value = await fetchPlaylists();
  } catch (err) {
    console.error('Failed to load playlists:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleCreate() {
  if (!newName.value.trim()) return;
  try {
    const pl = await createPlaylist(newName.value.trim());
    newName.value = '';
    showCreate.value = false;
    router.push(`/playlists/${pl.id}`);
  } catch (err) {
    console.error('Failed to create playlist:', err);
  }
}

async function handleDelete(id: string) {
  if (!confirm('Vuoi davvero eliminare questa playlist?')) return;
  try {
    await deletePlaylist(id);
    playlists.value = playlists.value.filter(p => p.id !== id);
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-4 font-mono select-none">
    <!-- Header -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[#00ff66] font-bold text-sm">■ [ ARCHIVIO PLAYLIST ]</span>
          <span class="text-xs text-[#ffff00]">[{{ playlists.length }} PLAYLIST]</span>
        </div>
        <p class="text-[11px] text-[#777777] mt-0.5">&gt; Raccolte musicali personalizzate dell'utente</p>
      </div>

      <button
        @click="showCreate = true"
        class="bbs-btn bbs-btn-green py-1.5 px-3 text-xs self-start sm:self-auto"
      >
        <span>[+ NUOVA PLAYLIST]</span>
      </button>
    </div>

    <!-- Create Inline Form in BBS Box -->
    <div v-if="showCreate" class="p-3 border-2 border-[#00ff66] bg-black shadow-[0_0_15px_rgba(0,255,102,0.15)] flex items-center gap-2">
      <span class="text-[#00ff66] text-xs font-bold">&gt; NOME PLAYLIST:</span>
      <input
        v-model="newName"
        type="text"
        placeholder="Es: Workout, Notte, Top Tracks..."
        class="flex-1 bg-[#0a0a0a] text-xs text-[#ffff00] px-3 py-1.5 border border-[#333333] focus:outline-none focus:border-[#00ff66]"
        @keyup.enter="handleCreate"
        autofocus
      />
      <button
        @click="handleCreate"
        :disabled="!newName.trim()"
        class="bbs-btn bbs-btn-green py-1 px-3 text-xs"
      >
        [SALVA]
      </button>
      <button
        @click="showCreate = false"
        class="bbs-btn py-1 px-2 text-xs border-[#333333] text-[#888888]"
      >
        [ANNULLA]
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && playlists.length === 0" class="border border-[#222222] p-12 text-center text-[#666666]">
      <ListMusic class="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00ff66]" />
      <p class="text-xs">&gt; NESSUNA PLAYLIST SALVATA &lt;</p>
      <p class="text-[10px] text-[#555555] mt-1">Premi [+ NUOVA PLAYLIST] per crearne una.</p>
    </div>

    <!-- Playlists Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div
        v-for="pl in playlists"
        :key="pl.id"
        @click="router.push(`/playlists/${pl.id}`)"
        class="group p-2.5 bg-[#070707] border border-[#222222] hover:border-[#00ff66] hover:bg-[#001710] transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div class="space-y-2">
          <div class="aspect-square bg-black border border-[#333333] group-hover:border-[#00ff66] overflow-hidden">
            <img
              :src="`/api/playlists/${pl.id}/cover`"
              :alt="pl.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div>
            <h3 class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#00ff66] transition-colors">
              {{ pl.name }}
            </h3>
            <p class="text-[10px] text-[#888888] mt-0.5">
              [{{ pl.trackCount }} BRANI] • {{ formatTime(pl.totalDuration) }}
            </p>
          </div>
        </div>

        <div class="pt-2 border-t border-[#1f1f1f] mt-2 flex items-center justify-between text-xs">
          <button
            @click.stop="toggleFavorite('playlist', pl.id)"
            class="font-bold transition-colors"
            :class="isFavorite('playlist', pl.id) ? 'text-[#ff3366]' : 'text-[#555555] hover:text-[#ff3366]'"
            :title="isFavorite('playlist', pl.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
          >
            <span>{{ isFavorite('playlist', pl.id) ? '[★]' : '[☆]' }}</span>
          </button>

          <button
            @click.stop="handleDelete(pl.id)"
            class="text-[#555555] hover:text-[#ff3366] text-[10px] font-bold"
            title="Elimina playlist"
          >
            [ELIMINA]
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
