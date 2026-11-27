<script setup lang="ts">
import type { FavoriteItem, FavoriteItemType } from '@quarter-note/shared';
import { formatTime } from '../../stores/player';
import { t } from '../../i18n';

defineProps<{
  item: FavoriteItem;
  index: number;
  containerId: string;
  isDragged: boolean;
  canMove?: boolean;
}>();

const emit = defineEmits<{
  (e: 'dragstart', event: DragEvent, item: FavoriteItem, containerId: string): void;
  (e: 'dragend', event?: DragEvent): void;
  (e: 'toggle-favorite', itemType: FavoriteItemType, itemId: string): void;
  (e: 'play', item: FavoriteItem): void;
  (e: 'move-request', item: FavoriteItem, containerId: string): void;
}>();
</script>

<template>
  <div
    draggable="true"
    @dragstart="emit('dragstart', $event, item, containerId)"
    @dragend="emit('dragend', $event)"
    class="group flex items-center justify-between px-2 py-1 text-xs select-none transition-colors border-b border-theme-border-subtle hover:bg-theme-active-bg hover:text-theme-highlight"
    :class="[
      isDragged ? 'opacity-30 bg-theme-panel border-theme-accent' : ''
    ]"
  >
    <!-- Left: Grip + Info -->
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
      <span 
        class="text-theme-border-dim group-hover:text-theme-accent cursor-grab font-bold px-0.5 shrink-0" 
        :title="t('favorites.dragToMove')"
      >
        [::]
      </span>

      <div 
        @click="emit('play', item)"
        class="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
      >
        <span class="w-5 text-center text-theme-text-dim group-hover:text-white text-[10px]">
          {{ String(index + 1).padStart(2, '0') }}.
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-theme-text group-hover:text-white truncate">
            {{ item.track?.title || 'Track' }}
          </p>
          <p class="text-[9px] text-theme-accent group-hover:text-white/80 opacity-80 truncate">
            {{ item.track?.artistName }} • {{ item.track?.albumTitle }}
          </p>
        </div>
      </div>
    </div>

    <!-- Right: Move + Remove + Duration -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
      <button
        v-if="canMove"
        @click.stop="emit('move-request', item, containerId)"
        class="text-theme-accent hover:text-theme-highlight text-xs font-bold cursor-pointer px-0.5"
        :title="t('favorites.moveTo')"
      >
        {{ t('favorites.moveBtn') }}
      </button>
      <button
        @click.stop="emit('toggle-favorite', 'track', item.itemId)"
        class="text-theme-danger text-xs font-bold cursor-pointer"
        :title="t('favorites.removeFromFavorites')"
      >
        [★]
      </button>
      <span v-if="item.track" class="w-11 text-right text-[10px] text-theme-text-dim tabular-nums">
        {{ formatTime(item.track.duration) }}
      </span>
    </div>
  </div>
</template>
