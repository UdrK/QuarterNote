<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RefreshCw } from '@lucide/vue';
import { fetchSettings, updateSettings, triggerScan } from '../api/client';
import TuiWindow from '../components/TuiWindow.vue';
import type { AppSettings, DefaultViewType } from '@quarter-note/shared';

const settings = ref<AppSettings | null>(null);
const musicDirInput = ref('');
const defaultViewInput = ref<DefaultViewType>('artists');
const isSaving = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const isLoading = ref(true);

const viewOptions: { id: DefaultViewType; label: string; desc: string; key: string }[] = [
  { id: 'artists', label: 'Artists', desc: 'Browse artists with photos', key: 'F2' },
  { id: 'albums', label: 'Albums', desc: 'Catalog of album covers', key: 'F3' },
  { id: 'favorites', label: 'Favorites', desc: 'Categories and favorite items', key: 'F4' },
  { id: 'playlists', label: 'Playlists', desc: 'Personal playlists', key: 'F5' },
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
      text: err instanceof Error ? err.message : 'Unable to load settings',
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
      text: `Default startup view set to "${viewOptions.find(o => o.id === view)?.label}"`,
    };
  } catch (err) {
    console.error('Failed to save default view setting:', err);
  }
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
      text: err instanceof Error ? err.message : 'Error while saving',
    };
  } finally {
    isSaving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <TuiWindow 
    title="SYSTEM CONFIGURATION" 
    badge="NODE: LOCALHOST" 
    hotkey="F6"
    variant="cyan"
  >
    <div class="space-y-4 max-w-4xl font-mono select-none">
      <!-- Status Message -->
      <div
        v-if="message"
        class="p-1.5 text-xs border font-bold"
        :class="[
          message.type === 'success'
            ? 'bg-[#002211] border-[#00ff66] text-[#00ff66]'
            : 'bg-[#220008] border-[#ff3366] text-[#ff3366]'
        ]"
      >
        <span>&gt;&gt; {{ message.text }}</span>
      </div>

      <!-- Default Startup Screen Card -->
      <div class="border border-[#1a2b3c] bg-[#050a12] p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-[#ffff00] border-b border-[#112233] pb-1">
          <span>┌──[ 1. DEFAULT STARTUP VIEW ]</span>
        </div>

        <p class="text-[10px] text-[#6688aa]">
          Module automatically loaded on startup:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
          <button
            v-for="opt in viewOptions"
            :key="opt.id"
            type="button"
            @click="handleViewChange(opt.id)"
            class="flex flex-col items-start p-2 border text-left transition-colors cursor-pointer"
            :class="[
              defaultViewInput === opt.id
                ? 'bg-[#00ffff] text-black border-[#00ffff] font-extrabold'
                : 'bg-black border-[#223d54] text-[#aaaaaa] hover:border-[#00ffff] hover:text-[#00ffff]'
            ]"
          >
            <div class="flex items-center justify-between w-full mb-0.5">
              <span class="text-xs">
                [{{ opt.label.toUpperCase() }}]
              </span>
              <span 
                class="text-[8px] font-bold px-1"
                :class="defaultViewInput === opt.id ? 'bg-black text-[#00ffff]' : 'bg-[#112233] text-[#446688]'"
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
      <div class="border border-[#1a2b3c] bg-[#050a12] p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-[#00ffff] border-b border-[#112233] pb-1">
          <span>┌──[ 2. MUSIC FOLDER PATH ]</span>
        </div>

        <p class="text-[10px] text-[#6688aa]">
          Absolute path on disk (e.g. <code class="text-[#ffff00]">C:\Music</code> or <code class="text-[#ffff00]">/music</code>).
        </p>

        <div class="flex items-center bg-black border border-[#00ffff]/60 px-2 py-1 focus-within:border-[#ffff00]">
          <span class="text-[#00ffff] text-xs font-bold mr-2">&gt; PATH:</span>
          <input
            v-model="musicDirInput"
            type="text"
            placeholder="C:\Users\username\Music"
            class="flex-1 bg-transparent text-xs text-[#ffff00] font-mono focus:outline-none"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <button
            @click="handleSave(false)"
            :disabled="isSaving || !musicDirInput.trim()"
            class="bg-[#0f1f2d] hover:bg-[#00ffff] hover:text-black text-[#00ffff] border border-[#224466] py-1 px-3 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            <span>{{ isSaving ? '[ SAVING... ]' : '[ SAVE CONFIGURATION ]' }}</span>
          </button>

          <button
            @click="handleSave(true)"
            :disabled="isSaving || !musicDirInput.trim()"
            class="bg-[#00ff66] hover:bg-[#55ff99] text-black font-extrabold py-1 px-3 text-xs border border-[#00ff66] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isSaving }" />
            <span>[ SAVE &amp; RESCAN NOW ]</span>
          </button>
        </div>
      </div>

      <!-- Storage & DB Status -->
      <div v-if="settings && settings.musicDir" class="border border-[#1a2b3c] bg-[#050a12] p-3 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-[#00ff66] border-b border-[#112233] pb-1">
          <span>┌──[ 3. DATABASE &amp; CACHE STATS ]</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div class="bg-black border border-[#223d54] p-2">
            <span class="text-[9px] text-[#6688aa] font-bold">INDEXED TRACKS</span>
            <p class="text-base font-bold text-[#ffff00] mt-0.5">{{ settings.totalTracks }}</p>
          </div>

          <div class="bg-black border border-[#223d54] p-2">
            <span class="text-[9px] text-[#6688aa] font-bold">CATALOGED ALBUMS</span>
            <p class="text-base font-bold text-[#00ffff] mt-0.5">{{ settings.totalAlbums }}</p>
          </div>

          <div class="bg-black border border-[#223d54] p-2">
            <span class="text-[9px] text-[#6688aa] font-bold">REGISTERED ARTISTS</span>
            <p class="text-base font-bold text-[#00ff66] mt-0.5">{{ settings.totalArtists }}</p>
          </div>
        </div>

        <div class="text-[10px] text-[#556677] space-y-0.5 pt-1 border-t border-[#112233]">
          <p>&gt; Data storage: <span class="text-[#88aacc]">{{ settings.dataDir }}</span></p>
          <p>&gt; SQLite DB: <span class="text-[#88aacc]">{{ settings.dataDir }}/quarter.db</span></p>
        </div>
      </div>
    </div>
  </TuiWindow>
</template>
