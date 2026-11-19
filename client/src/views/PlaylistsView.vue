<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ListMusic } from '@lucide/vue';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../api/client';
import { formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
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
  <TuiWindow 
    title="ARCHIVIO PLAYLIST" 
    :badge="`${playlists.length} SALVATE`" 
    hotkey="F5"
    variant="green"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#003311] pb-2">
        <div class="text-[11px] text-[#00aa44]">
          &gt; Raccolte musicali personalizzate (Tasto rapido: [F5] o [4])
        </div>

        <button
          @click="showCreate = true"
          class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-extrabold px-3 py-1 text-xs border border-[#00ff66] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>[+ NUOVA PLAYLIST]</span>
        </button>
      </div>

      <!-- Create Inline Form in Curses Box -->
      <div v-if="showCreate" class="p-2.5 border-2 border-[#00ff66] bg-[#001710] flex items-center gap-2">
        <span class="text-[#00ff66] text-xs font-bold">&gt; NOME:</span>
        <input
          v-model="newName"
          type="text"
          placeholder="Es: Workout, Notturna, Top 50..."
          class="flex-1 bg-black text-xs text-[#ffff00] px-2 py-1 border border-[#00ff66]/60 focus:outline-none focus:border-[#ffff00] font-mono"
          @keyup.enter="handleCreate"
          autofocus
        />
        <button
          @click="handleCreate"
          :disabled="!newName.trim()"
          class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-bold px-3 py-1 text-xs border border-[#00ff66] cursor-pointer"
        >
          [SALVA]
        </button>
        <button
          @click="showCreate = false"
          class="bg-[#002211] text-[#aaaaaa] hover:text-white px-2 py-1 text-xs border border-[#004422] cursor-pointer"
        >
          [ANNULLA]
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && playlists.length === 0" class="border border-dashed border-[#003311] p-10 text-center text-[#006622]">
        <ListMusic class="w-8 h-8 mx-auto mb-2 opacity-30 text-[#00ff66]" />
        <p class="text-xs">&gt;&gt; NESSUNA PLAYLIST SALVATA &lt;&lt;</p>
      </div>

      <!-- Playlists Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        <div
          v-for="pl in playlists"
          :key="pl.id"
          @click="router.push(`/playlists/${pl.id}`)"
          class="group p-2 bg-[#000d07] border border-[#003311] hover:border-[#00ff66] hover:bg-[#001a0e] transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <div class="aspect-square bg-black border border-[#003311] group-hover:border-[#00ff66] overflow-hidden">
              <img
                :src="pl.coverUrl || `/api/playlists/${pl.id}/cover`"
                :alt="pl.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div>
              <h3 class="text-xs font-bold text-[#d4d4d4] truncate group-hover:text-[#00ff66] transition-colors">
                {{ pl.name }}
              </h3>
              <p class="text-[9px] text-[#668877]">
                [{{ pl.trackCount }} BRANI] • {{ formatTime(pl.totalDuration) }}
              </p>
            </div>
          </div>

          <div class="pt-1.5 border-t border-[#00220d] mt-2 flex items-center justify-between text-xs">
            <button
              @click.stop="toggleFavorite('playlist', pl.id)"
              class="font-bold transition-colors cursor-pointer"
              :class="isFavorite('playlist', pl.id) ? 'text-[#ff3366]' : 'text-[#446655] hover:text-[#ff3366]'"
              :title="isFavorite('playlist', pl.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
            >
              <span>{{ isFavorite('playlist', pl.id) ? '[★]' : '[☆]' }}</span>
            </button>

            <button
              @click.stop="handleDelete(pl.id)"
              class="text-[#446655] hover:text-[#ff3366] text-[10px] font-bold cursor-pointer"
              title="Elimina playlist"
            >
              [ELIMINA]
            </button>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
