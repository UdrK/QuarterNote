<script setup lang="ts">
import type { FavoriteItem, FavoriteItemType } from '@quarter-note/shared';
import { t } from '../../i18n';

defineProps<{
  item: FavoriteItem;
  containerId: string;
  isDragged: boolean;
}>();

const emit = defineEmits<{
  (e: 'dragstart', event: DragEvent, item: FavoriteItem, containerId: string): void;
  (e: 'dragend', event?: DragEvent): void;
  (e: 'toggle-favorite', itemType: FavoriteItemType, itemId: string): void;
  (e: 'navigate', item: FavoriteItem): void;
  (e: 'play-album', albumId: string): void;
  (e: 'play-playlist', playlistId: string): void;
}>();
</script>

<template>
  <div
    draggable="true"
    @dragstart="emit('dragstart', $event, item, containerId)"
    @dragend="emit('dragend', $event)"
    class="group relative flex flex-col p-2 bg-theme-panel border border-theme-border-dim hover:border-theme-accent hover:bg-theme-card transition-colors cursor-pointer select-none"
    :class="[
      isDragged ? 'opacity-30 bg-theme-panel border-theme-accent' : ''
    ]"
    @click="emit('navigate', item)"
  >
    <!-- Top bar -->
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-1 min-w-0">
        <span 
          class="text-theme-text-dim group-hover:text-theme-accent cursor-grab font-bold shrink-0 text-xs" 
          :title="t('favorites.dragToMove')"
        >
          [::]
        </span>

        <span
          class="text-[8px] font-bold px-1 text-black uppercase"
          :class="[
            item.itemType === 'artist' ? 'bg-[#00ffff]' :
            item.itemType === 'album' ? 'bg-[#ffff00]' :
            'bg-[#00ff66]'
          ]"
        >
          {{ item.itemType === 'artist' ? t('favorites.artistBadge') : item.itemType === 'album' ? t('favorites.albumBadge') : t('favorites.playlistBadge') }}
        </span>
      </div>

      <button
        @click.stop="emit('toggle-favorite', item.itemType, item.itemId)"
        class="text-theme-danger text-xs font-bold cursor-pointer"
        :title="t('favorites.removeFromFavorites')"
      >
        [★]
      </button>
    </div>

    <!-- Media thumbnail -->
    <!-- Artist -->
    <div v-if="item.itemType === 'artist'" class="flex flex-col items-center text-center my-1">
      <div class="w-16 h-16 bg-theme-bg border border-theme-border-dim group-hover:border-theme-accent overflow-hidden mb-1">
        <img
          :src="item.artist?.imageUrl || `/api/artists/${item.itemId}/image`"
          :alt="item.artist?.name || 'Artist'"
          class="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      </div>
      <h4 class="text-xs font-bold text-theme-text group-hover:text-theme-highlight truncate w-full">
        {{ item.artist?.name || 'Artist' }}
      </h4>
      <p class="text-[9px] text-theme-accent opacity-80">
        {{ t('favorites.albumsCount', { count: item.artist?.albumCount || 0 }) }}
      </p>
    </div>

    <!-- Album -->
    <div v-else-if="item.itemType === 'album'" class="flex flex-col">
      <div class="relative aspect-square bg-theme-bg border border-theme-border-dim group-hover:border-theme-highlight overflow-hidden mb-1">
        <img
          :src="`/api/cover/${item.itemId}`"
          :alt="item.album?.title || 'Album'"
          class="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
        <button
          @click.stop="emit('play-album', item.itemId)"
          class="absolute bottom-1 right-1 bg-theme-highlight text-black font-bold px-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          :title="t('favorites.playAlbum')"
        >
          [▶]
        </button>
      </div>
      <h4 class="text-xs font-bold text-theme-text group-hover:text-theme-highlight truncate" :title="item.album?.title">
        {{ item.album?.title || 'Album' }}
      </h4>
      <p class="text-[9px] text-theme-accent truncate opacity-80">
        &gt; {{ item.album?.artistName }}
      </p>
    </div>

    <!-- Playlist -->
    <div v-else-if="item.itemType === 'playlist'" class="flex flex-col">
      <div class="relative aspect-square bg-theme-bg border border-theme-border-dim group-hover:border-theme-success overflow-hidden mb-1">
        <img
          :src="item.playlist?.coverUrl || `/api/playlists/${item.itemId}/cover`"
          :alt="item.playlist?.name || 'Playlist'"
          class="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
        <button
          @click.stop="emit('play-playlist', item.itemId)"
          class="absolute bottom-1 right-1 bg-theme-success text-black font-bold px-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          :title="t('favorites.playPlaylist')"
        >
          [▶]
        </button>
      </div>
      <h4 class="text-xs font-bold text-theme-text group-hover:text-theme-success truncate">
        {{ item.playlist?.name || 'Playlist' }}
      </h4>
      <p class="text-[9px] text-theme-text-dim">
        {{ t('favorites.tracksCount', { count: item.playlist?.trackCount || 0 }) }}
      </p>
    </div>
  </div>
</template>
