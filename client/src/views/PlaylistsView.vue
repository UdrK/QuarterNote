<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ListMusic, Plus, Trash2 } from '@lucide/vue';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../api/client';
import { formatTime } from '../stores/player';
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
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Playlist</h1>
        <p class="text-xs text-slate-400">{{ playlists.length }} playlist create</p>
      </div>

      <button
        @click="showCreate = true"
        class="flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>Nuova Playlist</span>
      </button>
    </div>

    <!-- Create Inline/Modal Form -->
    <div v-if="showCreate" class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
      <input
        v-model="newName"
        type="text"
        placeholder="Nome della playlist..."
        class="flex-1 bg-slate-800 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
        @keyup.enter="handleCreate"
      />
      <button
        @click="handleCreate"
        :disabled="!newName.trim()"
        class="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-50 transition-colors"
      >
        Salva
      </button>
      <button
        @click="showCreate = false"
        class="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
      >
        Annulla
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && playlists.length === 0" class="text-center py-20 text-slate-500">
      <ListMusic class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Nessuna playlist creata.</p>
      <p class="text-xs text-slate-600 mt-1">Crea la tua prima playlist usando il pulsante in alto a destra.</p>
    </div>

    <!-- Playlists Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div
        v-for="pl in playlists"
        :key="pl.id"
        @click="router.push(`/playlists/${pl.id}`)"
        class="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="w-12 h-12 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
            <ListMusic class="w-6 h-6" />
          </div>

          <div>
            <h3 class="text-sm font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
              {{ pl.name }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ pl.trackCount }} brani • {{ formatTime(pl.totalDuration) }}
            </p>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/60 mt-4 flex items-center justify-end">
          <button
            @click.stop="handleDelete(pl.id)"
            class="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
            title="Elimina playlist"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
