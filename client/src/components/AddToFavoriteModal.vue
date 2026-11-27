<script setup lang="ts">
import { ref, watch } from 'vue';
import { favoritesState, loadFavorites, createDivider, toggleFavorite } from '../stores/favorites';
import { t } from '../i18n';

const newName = ref('');
const isCreating = ref(false);
const addedTo = ref<string | null>(null);

watch(
  () => favoritesState.pendingAdd,
  (val) => {
    if (val) {
      newName.value = '';
      addedTo.value = null;
      if (favoritesState.containers.length === 0 && !favoritesState.isLoading) {
        void loadFavorites();
      }
    }
  },
  { immediate: true }
);

function close() {
  favoritesState.pendingAdd = null;
}

async function handleAddTo(containerId: string) {
  const pending = favoritesState.pendingAdd;
  if (!pending || addedTo.value) return;
  try {
    await toggleFavorite(pending.type, pending.id, containerId);
    addedTo.value = containerId;
    setTimeout(() => {
      close();
    }, 400);
  } catch (err) {
    console.error('Failed to add favorite to category:', err);
  }
}

async function handleCreateAndAdd() {
  const pending = favoritesState.pendingAdd;
  if (!pending || !newName.value.trim() || isCreating.value) return;
  try {
    isCreating.value = true;
    const container = await createDivider(newName.value.trim());
    await toggleFavorite(pending.type, pending.id, container.id);
    addedTo.value = container.id;
    setTimeout(() => {
      close();
    }, 400);
  } catch (err) {
    console.error('Failed to create favorite category:', err);
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <div
    v-if="favoritesState.pendingAdd"
    class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 font-mono"
    @click.self="close"
  >
    <div class="bg-theme-panel border-2 border-theme-border w-full max-w-sm shadow-2xl overflow-hidden select-none">
      <!-- Header -->
      <div class="px-4 py-2 border-b border-theme-border-dim bg-theme-header-bg flex items-center justify-between gap-2">
        <div class="min-w-0">
          <h3 class="text-xs font-bold text-theme-header-fg">■ [ {{ t('favorites.addToTitle') }} ]</h3>
          <p class="text-[10px] text-theme-header-fg opacity-80 truncate">
            &gt; {{ t('favorites.moveTitle') }}
          </p>
        </div>
        <button @click="close" class="bbs-btn py-0.5 px-1.5 text-xs border-theme-border-dim shrink-0">
          [X]
        </button>
      </div>

      <!-- New category form -->
      <div class="p-3 border-b border-theme-border-subtle bg-theme-surface">
        <form @submit.prevent="handleCreateAndAdd" class="flex items-center gap-2">
          <input
            v-model="newName"
            type="text"
            :placeholder="t('favorites.newCategoryPlaceholder')"
            class="flex-1 min-w-0 bg-theme-bg text-xs text-theme-highlight px-2.5 py-1.5 border border-theme-border-dim focus:outline-none focus:border-theme-accent"
          />
          <button
            type="submit"
            :disabled="!newName.trim() || isCreating"
            class="bbs-btn py-1.5 px-3 text-xs bg-theme-panel text-theme-accent hover:bg-theme-accent hover:text-theme-accent-contrast disabled:opacity-40 shrink-0"
          >
            {{ t('favorites.createBtn') }}
          </button>
        </form>
      </div>

      <!-- Categories list -->
      <div class="max-h-60 overflow-y-auto p-2 space-y-1 bg-theme-surface">
        <div v-if="favoritesState.isLoading" class="text-center py-6 text-xs text-theme-text-dim">
          {{ t('common.loading') }}
        </div>

        <div v-else-if="favoritesState.containers.length === 0" class="text-center py-6 text-xs text-theme-text-dim italic">
          {{ t('favorites.noCategories') }}
        </div>

        <button
          v-else
          v-for="container in favoritesState.containers"
          :key="container.id"
          @click="handleAddTo(container.id)"
          class="w-full flex items-center justify-between px-2.5 py-2 text-xs text-theme-text border border-theme-border-subtle hover:bg-theme-active-bg hover:border-theme-accent hover:text-white transition-colors group cursor-pointer"
        >
          <span class="font-bold uppercase truncate">&gt; {{ container.title }}</span>
          <span v-if="addedTo === container.id" class="text-theme-success font-bold shrink-0 ml-2">
            {{ t('favorites.added') }}
          </span>
          <span v-else class="text-[10px] text-theme-text-dim group-hover:text-white/80 shrink-0 ml-2">
            [{{ container.items.length }}]
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
