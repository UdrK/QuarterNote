<script setup lang="ts">
import { ref } from 'vue';
import type { FavoriteContainer, FavoriteItem, FavoriteItemType } from '@quarter-note/shared';
import FavoriteTrackRow from './FavoriteTrackRow.vue';
import FavoriteMediaCard from './FavoriteMediaCard.vue';
import { t } from '../../i18n';

const props = defineProps<{
  container: FavoriteContainer;
  dragOverContainerId: string | null;
  draggedItemId?: string | null;
  editingDividerId: string | null;
  canMove?: boolean;
}>();

const emit = defineEmits<{
  (e: 'dragover', event: DragEvent, containerId: string): void;
  (e: 'dragenter', containerId: string): void;
  (e: 'dragleave', event: DragEvent, containerId: string): void;
  (e: 'drop', event: DragEvent, containerId: string): void;
  (e: 'dragstart', event: DragEvent, item: FavoriteItem, containerId: string): void;
  (e: 'dragend', event?: DragEvent): void;
  (e: 'start-rename', container: FavoriteContainer): void;
  (e: 'save-rename', id: string, title: string): void;
  (e: 'cancel-rename'): void;
  (e: 'delete', id: string, title: string): void;
  (e: 'toggle-favorite', itemType: FavoriteItemType, itemId: string): void;
  (e: 'navigate', item: FavoriteItem): void;
  (e: 'play-track', item: FavoriteItem): void;
  (e: 'play-album', albumId: string): void;
  (e: 'play-playlist', playlistId: string): void;
  (e: 'move-request', item: FavoriteItem, containerId: string): void;
}>();

const renameTitle = ref(props.container.title);

function handleStartRename() {
  renameTitle.value = props.container.title;
  emit('start-rename', props.container);
}

function handleSaveRename() {
  if (!renameTitle.value.trim()) return;
  emit('save-rename', props.container.id, renameTitle.value.trim());
}
</script>

<template>
  <section
    class="space-y-2 p-2 transition-colors border"
    :class="[
      dragOverContainerId === container.id
        ? 'border-theme-accent bg-theme-panel'
        : 'border-transparent'
    ]"
    @dragover="emit('dragover', $event, container.id)"
    @dragenter="emit('dragenter', container.id)"
    @dragleave="emit('dragleave', $event, container.id)"
    @drop="emit('drop', $event, container.id)"
  >
    <!-- Curses Divider Line with Centered Header -->
    <div class="relative flex items-center py-1 group/divider">
      <div 
        class="flex-grow border-t"
        :class="dragOverContainerId === container.id ? 'border-theme-accent' : 'border-theme-border-dim group-hover/divider:border-theme-accent/60'"
      />

      <!-- Category Header Box -->
      <div 
        class="flex items-center gap-2 px-3 py-0.5 bg-theme-panel border transition-all"
        :class="[
          dragOverContainerId === container.id
            ? 'border-theme-accent text-theme-highlight bg-theme-active-bg'
            : 'border-theme-border-dim group-hover/divider:border-theme-accent'
        ]"
      >
        <!-- Inline Edit Title -->
        <template v-if="editingDividerId === container.id">
          <input
            v-model="renameTitle"
            type="text"
            class="bg-theme-bg text-xs text-theme-highlight font-bold px-1 py-0.5 border border-theme-highlight focus:outline-none w-36 uppercase font-mono"
            @keyup.enter="handleSaveRename"
            @keyup.esc="emit('cancel-rename')"
            autofocus
          />
          <button @click="handleSaveRename" class="text-theme-success text-xs font-bold px-1 cursor-pointer">
            [✓]
          </button>
          <button @click="emit('cancel-rename')" class="text-theme-text-dim text-xs font-bold px-1 cursor-pointer">
            [X]
          </button>
        </template>

        <!-- Normal Title -->
        <template v-else>
          <span class="text-xs font-bold uppercase tracking-wider" :class="dragOverContainerId === container.id ? 'text-theme-highlight' : 'text-theme-accent'">
            ╔═[ {{ container.title }} ]═╗
          </span>

          <!-- Action Buttons (always visible on mobile, hover on desktop) -->
          <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/divider:opacity-100 transition-opacity ml-1">
            <button
              @click="handleStartRename"
              title="Rename category"
              class="text-[10px] text-theme-text-dim hover:text-theme-accent cursor-pointer"
            >
              [✎]
            </button>
            <button
              @click="emit('delete', container.id, container.title)"
              title="Delete category"
              class="text-[10px] text-theme-text-dim hover:text-theme-danger cursor-pointer"
            >
              [✕]
            </button>
          </div>
        </template>
      </div>

      <div 
        class="flex-grow border-t"
        :class="dragOverContainerId === container.id ? 'border-theme-accent' : 'border-theme-border-dim group-hover/divider:border-theme-accent/60'"
      />
    </div>

    <!-- Empty Category Drop Zone -->
    <div
      v-if="container.items.length === 0"
      class="border border-dashed p-4 text-center transition-colors"
      :class="[
        dragOverContainerId === container.id
          ? 'border-theme-accent bg-theme-panel text-theme-accent'
          : 'border-theme-border-dim text-theme-text-dim'
      ]"
    >
      <p class="text-xs font-bold">
        {{ dragOverContainerId === container.id ? t('favorites.dropHere') : t('favorites.dragPrompt') }}
      </p>
    </div>

    <!-- Items Area -->
    <div v-else class="space-y-2">
      <!-- Tracks within container -->
      <div
        v-if="container.items.some(i => i.itemType === 'track')"
        class="border border-theme-border-dim bg-theme-panel space-y-0.5"
      >
        <FavoriteTrackRow
          v-for="(item, idx) in container.items.filter(i => i.itemType === 'track')"
          :key="item.id"
          :item="item"
          :index="idx"
          :container-id="container.id"
          :is-dragged="draggedItemId === item.id"
          :can-move="canMove"
          @dragstart="(ev, itm, cId) => emit('dragstart', ev, itm, cId)"
          @dragend="(ev) => emit('dragend', ev)"
          @toggle-favorite="(type, id) => emit('toggle-favorite', type, id)"
          @play="(itm) => emit('play-track', itm)"
          @move-request="(itm, cId) => emit('move-request', itm, cId)"
        />
      </div>

      <!-- Cards (Artists, Albums, Playlists) -->
      <div
        v-if="container.items.some(i => i.itemType !== 'track')"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        <FavoriteMediaCard
          v-for="item in container.items.filter(i => i.itemType !== 'track')"
          :key="item.id"
          :item="item"
          :container-id="container.id"
          :is-dragged="draggedItemId === item.id"
          :can-move="canMove"
          @dragstart="(ev, itm, cId) => emit('dragstart', ev, itm, cId)"
          @dragend="(ev) => emit('dragend', ev)"
          @toggle-favorite="(type, id) => emit('toggle-favorite', type, id)"
          @navigate="(itm) => emit('navigate', itm)"
          @play-album="(id) => emit('play-album', id)"
          @play-playlist="(id) => emit('play-playlist', id)"
          @move-request="(itm, cId) => emit('move-request', itm, cId)"
        />
      </div>
    </div>
  </section>
</template>
