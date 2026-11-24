<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RefreshCw } from '@lucide/vue';
import { fetchSettings, updateSettings, triggerScan } from '../api/client';
import TuiWindow from '../components/TuiWindow.vue';
import type { AppSettings, DefaultViewType } from '@quarter-note/shared';
import { currentTheme, availableThemes, setTheme, type ThemeName } from '../composables/useTheme';
import { currentLocale, availableLocales, setLocale, t, type Locale } from '../i18n';

const settings = ref<AppSettings | null>(null);
const musicDirInput = ref('');
const defaultViewInput = ref<DefaultViewType>('artists');
const isSaving = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const isLoading = ref(true);

const viewOptions: { id: DefaultViewType; labelKey: string; desc: string; key: string }[] = [
  { id: 'artists', labelKey: 'nav.artists', desc: 'Browse artists with photos', key: 'F2' },
  { id: 'albums', labelKey: 'nav.albums', desc: 'Catalog of album covers', key: 'F3' },
  { id: 'favorites', labelKey: 'nav.favorites', desc: 'Categories and favorite items', key: 'F4' },
  { id: 'playlists', labelKey: 'nav.playlists', desc: 'Personal playlists', key: 'F5' },
];

async function load() {
  try {
    const data = await fetchSettings();
    if (data && typeof data === 'object' && 'musicDir' in data) {
      settings.value = data;
      musicDirInput.value = data.musicDir || '';
      defaultViewInput.value = data.defaultView || (localStorage.getItem('qn_default_view') as DefaultViewType) || 'artists';
      localStorage.setItem('qn_default_view', defaultViewInput.value);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
    message.value = {
      type: 'error',
      text: err instanceof Error ? err.message : t('common.error'),
    };
  } finally {
    isLoading.value = false;
  }
}

async function handleViewChange(view: DefaultViewType) {
  defaultViewInput.value = view;
  localStorage.setItem('qn_default_view', view);
  try {
    await updateSettings({ defaultView: view });
    message.value = {
      type: 'success',
      text: `Default view updated: ${view}`,
    };
  } catch (err) {
    console.error('Failed to save default view setting:', err);
  }
}

function handleThemeChange(themeId: ThemeName) {
  setTheme(themeId);
}

function handleLocaleChange(locId: Locale) {
  setLocale(locId);
}

async function handleSave(triggerScanAfter = false) {
  if (!musicDirInput.value.trim()) return;
  isSaving.value = true;
  message.value = null;

  try {
    const updated = await updateSettings({
      musicDir: musicDirInput.value.trim(),
      defaultView: defaultViewInput.value,
    });
    settings.value = updated;
    musicDirInput.value = updated.musicDir;
    localStorage.setItem('qn_default_view', updated.defaultView || defaultViewInput.value);

    if (triggerScanAfter) {
      await triggerScan();
      message.value = {
        type: 'success',
        text: 'Path saved! Scan started in background.',
      };
    } else {
      message.value = {
        type: 'success',
        text: 'Configuration updated successfully!',
      };
    }
  } catch (err) {
    message.value = {
      type: 'error',
      text: err instanceof Error ? err.message : t('common.error'),
    };
  } finally {
    isSaving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <TuiWindow 
    :title="t('settings.title')" 
    badge="NODE: LOCALHOST" 
    hotkey="F6"
    variant="default"
  >
    <div class="space-y-4 max-w-4xl font-mono select-none">
      <!-- Status Message -->
      <div
        v-if="message"
        class="p-1.5 text-xs border font-bold"
        :class="[
          message.type === 'success'
            ? 'bg-theme-panel border-theme-success text-theme-success'
            : 'bg-theme-panel border-theme-danger text-theme-danger'
        ]"
      >
        <span>&gt;&gt; {{ message.text }}</span>
      </div>

      <!-- Retro Theme Selection Card -->
      <div class="border border-theme-border-dim bg-theme-panel p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-theme-accent border-b border-theme-border-subtle pb-1">
          <span>┌──[ 1. {{ t('settings.theme') }} ]</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <button
            v-for="th in availableThemes"
            :key="th.id"
            type="button"
            @click="handleThemeChange(th.id)"
            class="p-2 border text-left transition-colors cursor-pointer"
            :class="[
              currentTheme === th.id
                ? 'bg-theme-accent text-theme-accent-contrast border-theme-accent font-extrabold'
                : 'bg-theme-bg border-theme-border-dim text-theme-text hover:border-theme-accent hover:text-theme-accent'
            ]"
          >
            <div class="flex items-center justify-between w-full mb-0.5">
              <span class="text-xs">[{{ th.tag }}]</span>
              <span v-if="currentTheme === th.id" class="text-[9px]">● ON</span>
            </div>
            <span class="text-[10px] block opacity-90">{{ th.name }}</span>
          </button>
        </div>
      </div>

      <!-- Language Selection Card -->
      <div class="border border-theme-border-dim bg-theme-panel p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-theme-highlight border-b border-theme-border-subtle pb-1">
          <span>┌──[ 2. {{ t('settings.language') }} ]</span>
        </div>

        <div class="flex items-center gap-2 pt-0.5">
          <button
            v-for="loc in availableLocales"
            :key="loc.id"
            type="button"
            @click="handleLocaleChange(loc.id)"
            class="px-3 py-1.5 border text-xs font-bold transition-colors cursor-pointer"
            :class="[
              currentLocale === loc.id
                ? 'bg-theme-highlight text-black border-theme-highlight font-extrabold'
                : 'bg-theme-bg border-theme-border-dim text-theme-text hover:border-theme-highlight hover:text-theme-highlight'
            ]"
          >
            [{{ loc.name.toUpperCase() }}]
          </button>
        </div>
      </div>

      <!-- Default Startup Screen Card -->
      <div class="border border-theme-border-dim bg-theme-panel p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-theme-accent border-b border-theme-border-subtle pb-1">
          <span>┌──[ 3. {{ t('settings.defaultView') }} ]</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
          <button
            v-for="opt in viewOptions"
            :key="opt.id"
            type="button"
            @click="handleViewChange(opt.id)"
            class="flex flex-col items-start p-2 border text-left transition-colors cursor-pointer"
            :class="[
              defaultViewInput === opt.id
                ? 'bg-theme-accent text-theme-accent-contrast border-theme-accent font-extrabold'
                : 'bg-theme-bg border-theme-border-dim text-theme-text hover:border-theme-accent hover:text-theme-accent'
            ]"
          >
            <div class="flex items-center justify-between w-full mb-0.5">
              <span class="text-xs">
                [{{ t(opt.labelKey) }}]
              </span>
              <span 
                class="text-[8px] font-bold px-1"
                :class="defaultViewInput === opt.id ? 'bg-theme-bg text-theme-accent' : 'bg-theme-card text-theme-text-dim'"
              >
                {{ opt.key }}
              </span>
            </div>
            <span class="text-[9px] opacity-80">
              {{ opt.desc }}
            </span>
          </button>
        </div>
      </div>

      <!-- Music Library Path Card -->
      <div class="border border-theme-border-dim bg-theme-panel p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-theme-accent border-b border-theme-border-subtle pb-1">
          <span>┌──[ 4. {{ t('settings.musicDir') }} ]</span>
        </div>

        <p class="text-[10px] text-theme-text-dim">
          Absolute path on disk (e.g. <code class="text-theme-highlight">C:\Music</code> or <code class="text-theme-highlight">/music</code>).
        </p>

        <div class="flex items-center bg-theme-bg border border-theme-border/60 px-2 py-1 focus-within:border-theme-highlight">
          <span class="text-theme-accent text-xs font-bold mr-2">&gt; PATH:</span>
          <input
            v-model="musicDirInput"
            type="text"
            placeholder="C:\Users\username\Music"
            class="flex-1 bg-transparent text-xs text-theme-highlight font-mono focus:outline-none"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <button
            @click="handleSave(false)"
            :disabled="isSaving || !musicDirInput.trim()"
            class="bg-theme-card hover:bg-theme-accent hover:text-theme-accent-contrast text-theme-accent border border-theme-border-dim py-1 px-3 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            <span>{{ isSaving ? t('common.loading') : t('settings.saveSettings') }}</span>
          </button>

          <button
            @click="handleSave(true)"
            :disabled="isSaving || !musicDirInput.trim()"
            class="bg-theme-success hover:opacity-90 text-black font-extrabold py-1 px-3 text-xs border border-theme-success transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isSaving }" />
            <span>{{ t('settings.rescanNow') }}</span>
          </button>
        </div>
      </div>

      <!-- Storage & DB Status -->
      <div v-if="settings && settings.musicDir" class="border border-theme-border-dim bg-theme-panel p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-theme-success border-b border-theme-border-subtle pb-1">
          <span>┌──[ 5. {{ t('settings.stats') }} ]</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div class="bg-theme-bg border border-theme-border-dim p-2">
            <span class="text-[9px] text-theme-text-dim font-bold">{{ t('settings.totalTracks') }}</span>
            <p class="text-base font-bold text-theme-highlight mt-0.5">{{ settings.totalTracks }}</p>
          </div>

          <div class="bg-theme-bg border border-theme-border-dim p-2">
            <span class="text-[9px] text-theme-text-dim font-bold">{{ t('settings.totalAlbums') }}</span>
            <p class="text-base font-bold text-theme-accent mt-0.5">{{ settings.totalAlbums }}</p>
          </div>

          <div class="bg-theme-bg border border-theme-border-dim p-2">
            <span class="text-[9px] text-theme-text-dim font-bold">{{ t('settings.totalArtists') }}</span>
            <p class="text-base font-bold text-theme-success mt-0.5">{{ settings.totalArtists }}</p>
          </div>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
