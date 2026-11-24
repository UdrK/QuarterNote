<script setup lang="ts">
import { ref } from 'vue';
import { t } from '../../i18n';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create', title: string): void;
}>();

const newDividerTitle = ref('');

function handleSave() {
  if (!newDividerTitle.value.trim()) return;
  emit('create', newDividerTitle.value.trim());
  newDividerTitle.value = '';
}

function handleCancel() {
  newDividerTitle.value = '';
  emit('update:modelValue', false);
}
</script>

<template>
  <div
    v-if="modelValue"
    class="p-2.5 border-2 border-theme-accent bg-theme-panel flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
  >
    <span class="text-theme-accent text-xs font-bold">{{ t('favorites.categoryName') }}</span>
    <input
      v-model="newDividerTitle"
      type="text"
      :placeholder="t('favorites.categoryPlaceholder')"
      class="flex-1 bg-theme-bg text-xs text-theme-highlight px-2 py-1 border border-theme-border-dim focus:outline-none focus:border-theme-highlight font-mono"
      @keyup.enter="handleSave"
      autofocus
    />
    <div class="flex items-center gap-1.5 self-end sm:self-auto">
      <button
        @click="handleSave"
        :disabled="!newDividerTitle.trim()"
        class="bg-theme-accent hover:opacity-90 text-theme-accent-contrast font-bold px-2.5 py-1 text-xs border border-theme-accent cursor-pointer disabled:opacity-50"
      >
        {{ t('common.save') }}
      </button>
      <button
        @click="handleCancel"
        class="bg-theme-card text-theme-text-dim hover:text-theme-text-bright px-2 py-1 text-xs border border-theme-border-dim cursor-pointer"
      >
        {{ t('common.cancel') }}
      </button>
    </div>
  </div>
</template>
