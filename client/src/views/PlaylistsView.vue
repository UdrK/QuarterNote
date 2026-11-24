<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ListMusic } from '@lucide/vue';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../api/client';
import { formatTime } from '../stores/player';
import { isFavorite, toggleFavorite } from '../stores/favorites';
import TuiWindow from '../components/TuiWindow.vue';
import type { Playlist } from '@quarter-note/shared';
import { t } from '../i18n';

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
  if (!confirm('Are you sure you want to delete this playlist?')) return;
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
    :title="t('playlists.title')" 
    :badge="t('playlists.badge', { count: playlists.length })" 
    hotkey="F5"
    variant="default"
  >
    <div class="space-y-3 font-mono select-none">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-subtle pb-2">
        <div class="text-[11px] text-theme-text-dim">
          &gt; Custom music collections (Hotkey: [F5] or [4])
        </div>

        <button
          @click="showCreate = true"
          class="bg-theme-accent hover:opacity-90 text-theme-accent-contrast font-extrabold px-3 py-1 text-xs border border-theme-accent transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{{ t('playlists.createPlaylist') }}</span>
        </button>
      </div>

      <!-- Create Inline Form in Curses Box -->
      <div v-if="showCreate" class="p-2.5 border-2 border-theme-accent bg-theme-panel flex items-center gap-2">
        <span class="text-theme-accent text-xs font-bold">&gt; NAME:</span>
        <input
          v-model="newName"
          type="text"
          :placeholder="t('playlists.namePlaceholder')"
          class="flex-1 bg-theme-bg text-xs text-theme-highlight px-2 py-1 border border-theme-border-dim focus:outline-none focus:border-theme-highlight font-mono"
          @keyup.enter="handleCreate"
          autofocus
        />
        <button
          @click="handleCreate"
          :disabled="!newName.trim()"
          class="bg-theme-accent hover:opacity-90 text-theme-accent-contrast font-bold px-3 py-1 text-xs border border-theme-accent cursor-pointer"
        >
          {{ t('common.save') }}
        </button>
        <button
          @click="showCreate = false"
          class="bg-theme-card text-theme-text-dim hover:text-theme-text-bright px-2 py-1 text-xs border border-theme-border-dim cursor-pointer"
        >
          {{ t('common.cancel') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && playlists.length === 0" class="border border-dashed border-theme-border-dim p-10 text-center text-theme-text-dim">
        <ListMusic class="w-8 h-8 mx-auto mb-2 opacity-30 text-theme-accent" />
        <p class="text-xs">&gt;&gt; {{ t('playlists.noPlaylists') }} &lt;&lt;</p>
      </div>

      <!-- Playlists Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        <div
          v-for="pl in playlists"
          :key="pl.id"
          @click="router.push(`/playlists/${pl.id}`)"
          class="group p-2 bg-theme-panel border border-theme-border-dim hover:border-theme-accent hover:bg-theme-card transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <div class="aspect-square bg-theme-bg border border-theme-border-dim group-hover:border-theme-accent overflow-hidden">
              <img
                :src="pl.coverUrl || `/api/playlists/${pl.id}/cover`"
                :alt="pl.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div>
              <h3 class="text-xs font-bold text-theme-text truncate group-hover:text-theme-highlight transition-colors">
                {{ pl.name }}
              </h3>
              <p class="text-[9px] text-theme-text-dim">
                {{ t('favorites.tracksCount', { count: pl.trackCount }) }} • {{ formatTime(pl.totalDuration) }}
              </p>
            </div>
          </div>

          <div class="pt-1.5 border-t border-theme-border-subtle mt-2 flex items-center justify-between text-xs">
            <button
              @click.stop="toggleFavorite('playlist', pl.id)"
              class="font-bold transition-colors cursor-pointer"
              :class="isFavorite('playlist', pl.id) ? 'text-theme-danger' : 'text-theme-text-dim hover:text-theme-danger'"
              :title="isFavorite('playlist', pl.id) ? t('favorites.removeFromFavorites') : 'Add to favorites'"
            >
              <span>{{ isFavorite('playlist', pl.id) ? '[★]' : '[☆]' }}</span>
            </button>

            <button
              @click.stop="handleDelete(pl.id)"
              class="text-theme-text-dim hover:text-theme-danger text-[10px] font-bold cursor-pointer"
              title="Delete playlist"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
