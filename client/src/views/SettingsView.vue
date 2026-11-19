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
  { id: 'artists', label: 'Artisti', icon: Users, desc: 'Visualizza tutti gli artisti con immagini' },
  { id: 'albums', label: 'Album', icon: Disc3, desc: 'Sfoglia le copertine degli album' },
  { id: 'favorites', label: 'Preferiti', icon: Heart, desc: 'Apri subito i tuoi divisori e preferiti' },
  { id: 'playlists', label: 'Playlist', icon: ListMusic, desc: 'Mostra le tue playlist personali' },
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
  <div class="p-6 max-w-3xl space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
        <SettingsIcon class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Impostazioni</h1>
        <p class="text-xs text-slate-400">Configura la tua libreria musicale e i percorsi del server</p>
      </div>
    </div>

    <!-- Feedback Message Banner -->
    <div
      v-if="message"
      class="p-4 rounded-xl text-xs flex items-center gap-3 transition-all animate-in fade-in"
      :class="[
        message.type === 'success'
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border border-red-500/20 text-red-400'
      ]"
    >
      <CheckCircle2 v-if="message.type === 'success'" class="w-4 h-4 shrink-0" />
      <AlertCircle v-else class="w-4 h-4 shrink-0" />
      <span class="font-medium">{{ message.text }}</span>
    </div>

    <!-- Default Startup Screen Card -->
    <div class="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur">
      <div class="flex items-center gap-2.5">
        <LayoutGrid class="w-4 h-4 text-sky-400" />
        <h2 class="text-sm font-bold text-slate-100">Schermata Iniziale Predefinita</h2>
      </div>

      <p class="text-xs text-slate-400 leading-relaxed">
        Scegli quale schermata aprire automaticamente all'avvio dell'applicazione.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <button
          v-for="opt in viewOptions"
          :key="opt.id"
          type="button"
          @click="handleViewChange(opt.id)"
          class="flex flex-col items-start p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer"
          :class="[
            defaultViewInput === opt.id
              ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/50 shadow-md shadow-sky-500/10'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          ]"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <component 
              :is="opt.icon" 
              class="w-4 h-4" 
              :class="defaultViewInput === opt.id ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'" 
            />
            <span 
              class="text-xs font-bold" 
              :class="defaultViewInput === opt.id ? 'text-sky-300' : 'text-slate-200'"
            >
              {{ opt.label }}
            </span>
          </div>
          <span class="text-[11px] text-slate-400 leading-snug">
            {{ opt.desc }}
          </span>
          <div 
            v-if="defaultViewInput === opt.id"
            class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400"
          />
        </button>
      </div>
    </div>

    <!-- Music Library Path Configuration Card -->
    <div class="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur">
      <div class="flex items-center gap-2.5">
        <Folder class="w-4 h-4 text-sky-400" />
        <h2 class="text-sm font-bold text-slate-100">Cartella Libreria Musicale</h2>
      </div>

      <p class="text-xs text-slate-400 leading-relaxed">
        Inserisci il percorso assoluto della cartella contenente la tua musica. Può essere una cartella locale su Windows (es. <code class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">C:\Users\costa\Music</code>) oppure il percorso nel container Docker (es. <code class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">/music</code>).
      </p>

      <div class="space-y-2">
        <label class="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Percorso Cartella Audio
        </label>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="musicDirInput"
            type="text"
            placeholder="Es: C:\Users\nome\Music oppure /music"
            class="flex-1 bg-slate-950 text-xs text-slate-100 font-mono px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          @click="handleSave(false)"
          :disabled="isSaving || !musicDirInput.trim()"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          {{ isSaving ? 'Salvataggio...' : 'Salva Percorso' }}
        </button>

        <button
          @click="handleSave(true)"
          :disabled="isSaving || !musicDirInput.trim()"
          class="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSaving }" />
          <span>Salva e Riscansiona Subito</span>
        </button>
      </div>
    </div>

    <!-- System & Storage Status Card -->
    <div v-if="settings && settings.musicDir" class="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur">
      <div class="flex items-center gap-2.5">
        <Database class="w-4 h-4 text-sky-400" />
        <h2 class="text-sm font-bold text-slate-100">Stato Archivio & Cache</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brani Indicizzati</span>
          <p class="text-xl font-bold text-slate-100 font-mono mt-1">{{ settings.totalTracks }}</p>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Album Rilevati</span>
          <p class="text-xl font-bold text-slate-100 font-mono mt-1">{{ settings.totalAlbums }}</p>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Artisti</span>
          <p class="text-xl font-bold text-slate-100 font-mono mt-1">{{ settings.totalArtists }}</p>
        </div>
      </div>

      <div class="text-[11px] text-slate-400 space-y-1 pt-1">
        <p><strong class="text-slate-300">Cartella dati & miniature:</strong> <span class="font-mono text-slate-400">{{ settings.dataDir }}</span></p>
        <p><strong class="text-slate-300">Database SQLite:</strong> <span class="font-mono text-slate-400">{{ settings.dataDir }}/quarter.db</span></p>
      </div>
    </div>
  </div>
</template>
