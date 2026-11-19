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
    class="border bg-black font-mono relative flex flex-col select-none transition-colors"
    :class="[
      variant === 'yellow' ? 'border-[#ffff00]' :
      variant === 'green' ? 'border-[#00ff66]' :
      variant === 'red' ? 'border-[#ff3366]' :
      variant === 'cyan' ? 'border-[#00ffff]' :
      'border-[#2e3b4e] hover:border-[#00ffff]'
    ]"
  >
    <!-- Top Border Line with Title and Badge embedded -->
    <div 
      class="flex items-center justify-between px-2 py-0.5 text-xs font-bold border-b transition-colors"
      :class="[
        variant === 'yellow' ? 'bg-[#1a1700] border-[#ffff00] text-[#ffff00]' :
        variant === 'green' ? 'bg-[#001710] border-[#00ff66] text-[#00ff66]' :
        variant === 'red' ? 'bg-[#220008] border-[#ff3366] text-[#ff3366]' :
        variant === 'cyan' ? 'bg-[#001f33] border-[#00ffff] text-[#00ffff]' :
        'bg-[#0a0f16] border-[#222e3d] text-[#00ffff]'
      ]"
    >
      <div class="flex items-center gap-1.5 truncate">
        <span v-if="hotkey" class="bg-[#00ffff] text-black px-1 text-[10px] font-bold">
          {{ hotkey }}
        </span>
        <span class="truncate">┌──[ {{ title.toUpperCase() }} ]</span>
      </div>

      <div v-if="badge" class="text-[10px] text-[#ffff00] shrink-0 ml-2">
        [ {{ badge }} ]──┐
      </div>
      <div v-else class="text-[10px] text-[#555555] shrink-0">
        ──┐
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-3 flex-1 overflow-auto">
      <slot />
    </div>

    <!-- Bottom Border Line -->
    <div 
      class="px-2 py-0.5 text-[9px] flex items-center justify-between border-t"
      :class="[
        variant === 'yellow' ? 'border-[#ffff00]/30 text-[#888800]' :
        variant === 'green' ? 'border-[#00ff66]/30 text-[#008833]' :
        variant === 'red' ? 'border-[#ff3366]/30 text-[#881122]' :
        variant === 'cyan' ? 'border-[#00ffff]/30 text-[#0088aa]' :
        'border-[#1a2330] text-[#445566]'
      ]"
    >
      <span>└──[ QN-TUI ]</span>
      <slot name="footer">
        <span>[ OK ]──┘</span>
      </slot>
    </div>
  </div>
</template>
