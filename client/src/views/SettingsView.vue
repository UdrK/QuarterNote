<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Settings as SettingsIcon, 
  Folder, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  Users,
  Disc3,
  Heart,
  ListMusic
} from '@lucide/vue';
import { fetchSettings, updateSettings, triggerScan } from '../api/client';
import type { AppSettings, DefaultViewType } from '@quarter-note/shared';

const settings = ref<AppSettings | null>(null);
const musicDirInput = ref('');
const defaultViewInput = ref<DefaultViewType>('artists');
const isSaving = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const isLoading = ref(true);

const viewOptions: { id: DefaultViewType; label: string; icon: any; desc: string }[] = [
  { id: 'artists', label: 'Artisti', icon: Users, desc: 'Tutti gli artisti con foto album' },
  { id: 'albums', label: 'Album', icon: Disc3, desc: 'Catalogo copertine degli album' },
  { id: 'favorites', label: 'Preferiti', icon: Heart, desc: 'Divisori e categorie preferite' },
  { id: 'playlists', label: 'Playlist', icon: ListMusic, desc: 'Le tue playlist salvate' },
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
      text: err instanceof Error ? err.message : 'Impossibile caricare le impostazioni',
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
      text: `Schermata iniziale predefinita impostata su "${viewOptions.find(o => o.id === view)?.label}"`,
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
        text: 'Percorso salvato con successo! Scansione avviata in background.',
      };
    } else {
      message.value = {
        type: 'success',
        text: 'Impostazioni aggiornate con successo!',
      };
    }
  } catch (err) {
    message.value = {
      type: 'error',
      text: err instanceof Error ? err.message : 'Errore durante il salvataggio',
    };
  } finally {
    isSaving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-4 max-w-4xl font-mono select-none">
    <!-- Header -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-3">
      <div class="flex items-center gap-2">
        <span class="text-[#00ffff] font-bold text-sm">■ [ CONFIGURAZIONE SISTEMA BBS ]</span>
        <span class="text-xs text-[#00ff66]">[NODE: LOCAL]</span>
      </div>
      <p class="text-[11px] text-[#777777] mt-0.5">&gt; Parametri operativi, percorsi di storage e preferenze interfaccia</p>
    </div>

    <!-- Feedback Message Banner -->
    <div
      v-if="message"
      class="p-2 text-xs border"
      :class="[
        message.type === 'success'
          ? 'bg-[#002211] border-[#00ff66] text-[#00ff66]'
          : 'bg-[#220008] border-[#ff3366] text-[#ff3366]'
      ]"
    >
      <span class="font-bold">&gt;&gt; {{ message.text }}</span>
    </div>

    <!-- Default Startup Screen Card -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-4 space-y-3">
      <div class="flex items-center gap-2 text-xs font-bold text-[#ffff00] border-b border-[#1f1f1f] pb-1">
        <span>■ 1. SCHERMATA INIZIALE PREDEFINITA</span>
      </div>

      <p class="text-[11px] text-[#888888]">
        Seleziona quale modulo viene aperto all'avvio dell'applicazione:
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        <button
          v-for="opt in viewOptions"
          :key="opt.id"
          type="button"
          @click="handleViewChange(opt.id)"
          class="flex flex-col items-start p-2.5 border text-left transition-colors"
          :class="[
            defaultViewInput === opt.id
              ? 'bg-[#002b4d] border-[#00ffff] text-[#ffff00]'
              : 'bg-black border-[#222222] hover:border-[#444444] text-[#aaaaaa]'
          ]"
        >
          <div class="flex items-center justify-between w-full mb-1">
            <span class="text-xs font-bold">
              [{{ opt.label.toUpperCase() }}]
            </span>
            <span v-if="defaultViewInput === opt.id" class="text-[10px] text-[#00ff66]">
              ● ATTIVO
            </span>
          </div>
          <span class="text-[10px] text-[#777777]">
            {{ opt.desc }}
          </span>
        </button>
      </div>
    </div>

    <!-- Music Library Path Configuration Card -->
    <div class="border border-[#2a2a2a] bg-[#070707] p-4 space-y-3">
      <div class="flex items-center gap-2 text-xs font-bold text-[#00ffff] border-b border-[#1f1f1f] pb-1">
        <span>■ 2. PERCORSO CARTELLA MUSICALE</span>
      </div>

      <p class="text-[11px] text-[#888888]">
        Directory assoluta contenente i file audio (es: <code class="text-[#00ffff]">C:\Musica</code> oppure <code class="text-[#00ffff]">/music</code>).
      </p>

      <div class="space-y-1.5">
        <div class="flex items-center bg-black border border-[#333333] px-2 py-1.5 focus-within:border-[#00ffff]">
          <span class="text-[#00ffff] text-xs font-bold mr-2">&gt; PATH:</span>
          <input
            v-model="musicDirInput"
            type="text"
            placeholder="C:\Users\nome\Music"
            class="flex-1 bg-transparent text-xs text-[#ffff00] font-mono focus:outline-none"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 pt-1">
        <button
          @click="handleSave(false)"
          :disabled="isSaving || !musicDirInput.trim()"
          class="bbs-btn py-1.5 px-3 text-xs border-[#333333] disabled:opacity-40"
        >
          <span>{{ isSaving ? '[ IN SALVATAGGIO... ]' : '[ SALVA CONFIGURAZIONE ]' }}</span>
        </button>

        <button
          @click="handleSave(true)"
          :disabled="isSaving || !musicDirInput.trim()"
          class="bbs-btn bbs-btn-green py-1.5 px-3 text-xs disabled:opacity-40"
        >
          <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isSaving }" />
          <span>[ SALVA &amp; RISCANSIONA SUBITO ]</span>
        </button>
      </div>
    </div>

    <!-- System & Storage Status Card in BBS ASCII Table -->
    <div v-if="settings && settings.musicDir" class="border border-[#2a2a2a] bg-[#070707] p-4 space-y-3">
      <div class="flex items-center gap-2 text-xs font-bold text-[#00ff66] border-b border-[#1f1f1f] pb-1">
        <span>■ 3. STATO DATABASE &amp; CACHE</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div class="bg-black border border-[#222222] p-2.5">
          <span class="text-[9px] text-[#888888] font-bold">BRANI INDICIZZATI</span>
          <p class="text-lg font-bold text-[#ffff00] mt-0.5">{{ settings.totalTracks }}</p>
        </div>

        <div class="bg-black border border-[#222222] p-2.5">
          <span class="text-[9px] text-[#888888] font-bold">ALBUM CATALOGATI</span>
          <p class="text-lg font-bold text-[#00ffff] mt-0.5">{{ settings.totalAlbums }}</p>
        </div>

        <div class="bg-black border border-[#222222] p-2.5">
          <span class="text-[9px] text-[#888888] font-bold">ARTISTI REGISTRATI</span>
          <p class="text-lg font-bold text-[#00ff66] mt-0.5">{{ settings.totalArtists }}</p>
        </div>
      </div>

      <div class="text-[10px] text-[#666666] space-y-1 pt-1 border-t border-[#1a1a1a]">
        <p>&gt; Data storage: <span class="text-[#888888]">{{ settings.dataDir }}</span></p>
        <p>&gt; SQLite DB: <span class="text-[#888888]">{{ settings.dataDir }}/quarter.db</span></p>
      </div>
    </div>
  </div>
</template>
