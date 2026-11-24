<script setup lang="ts">
defineProps<{
  title: string;
  badge?: string;
  hotkey?: string;
  variant?: 'cyan' | 'yellow' | 'green' | 'red' | 'default';
}>();
</script>

<template>
  <div 
    class="border bg-theme-bg font-mono relative flex flex-col select-none transition-colors border-theme-border/60 hover:border-theme-border"
  >
    <!-- Top Border Line with Title and Badge embedded -->
    <div 
      class="flex items-center justify-between px-2 py-0.5 text-xs font-bold border-b transition-colors bg-theme-header-bg border-theme-border text-theme-header-fg"
    >
      <div class="flex items-center gap-1.5 truncate">
        <span v-if="hotkey" class="bg-theme-badge-bg text-theme-badge-fg px-1 text-[10px] font-bold">
          {{ hotkey }}
        </span>
        <span class="truncate">┌──[ {{ title.toUpperCase() }} ]</span>
      </div>

      <div v-if="badge" class="text-[10px] text-theme-highlight shrink-0 ml-2">
        [ {{ badge }} ]──┐
      </div>
      <div v-else class="text-[10px] text-theme-header-fg/70 shrink-0">
        ──┐
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-3 flex-1 overflow-auto bg-theme-bg">
      <slot />
    </div>

    <!-- Bottom Border Line -->
    <div 
      class="px-2 py-0.5 text-[9px] flex items-center justify-between border-t border-theme-border-subtle text-theme-text-dim"
    >
      <span>└──[ QN-TUI ]</span>
      <slot name="footer">
        <span>[ OK ]──┘</span>
      </slot>
    </div>
  </div>
</template>
