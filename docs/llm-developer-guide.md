# LLM Developer Guide for Quarter Note ♩

This guide provides structured instructions and recipes for developers using Large Language Models (LLMs) such as Claude, Gemini, ChatGPT, or GitHub Copilot to extend, modify, or debug **Quarter Note**.

---

## 1. Context & Architecture Summary

Quarter Note is a lightweight, zero-bloat music streamer with a retro BBS/curses Terminal User Interface (TUI).
- **Backend**: Fastify on Node 24 LTS, utilizing Node's built-in `node:sqlite` (`DatabaseSync`), `music-metadata` for audio tags, and `sharp` for 250x250 WebP thumbnails.
- **Frontend**: Vue 3 SPA with Vite and Tailwind CSS. All components adhere to a windowed curses TUI design (`TuiWindow`, `TuiFrame`, `CassettePlayer`, `SpectrumMeter`).
- **Shared Types**: `@quarter-note/shared` links backend DTOs and frontend state.
- **Target Platform**: Docker on ZimaBlade (CasaOS), x86_64 and ARM64.

---

## 2. LLM Step-by-Step Recipes

### Recipe 1: Adding a New Backend API Endpoint

1. **Define the Data Type** in `shared/src/index.ts`:
   ```typescript
   export interface MyFeatureResponse {
     success: boolean;
     items: string[];
   }
   ```
2. **Compile the Shared Package**:
   ```bash
   npm --workspace=shared run build
   ```
3. **Add Database Functions** in `server/src/db/repository.ts` if persistent data is needed:
   ```typescript
   export function getMyFeatureData(): string[] {
     const db = getDatabase();
     const rows = db.prepare('SELECT value FROM my_table').all() as unknown as { value: string }[];
     return rows.map(r => r.value);
   }
   ```
4. **Create the Fastify Route** in `server/src/routes/myFeature.ts`:
   ```typescript
   import type { FastifyPluginAsync } from 'fastify';
   import type { MyFeatureResponse } from '@quarter-note/shared';
   import { getMyFeatureData } from '../db/repository';

   export const myFeatureRoutes: FastifyPluginAsync = async (fastify) => {
     fastify.get<{ Reply: MyFeatureResponse }>('/my-feature', async () => {
       const items = getMyFeatureData();
       return { success: true, items };
     });
   };
   ```
5. **Register the Route** in `server/src/index.ts`:
   ```typescript
   import { myFeatureRoutes } from './routes/myFeature';
   // ...
   fastify.register(myFeatureRoutes, { prefix: '/api' });
   ```
6. **Add the Client Fetch Function** in `client/src/api/client.ts`:
   ```typescript
   import type { MyFeatureResponse } from '@quarter-note/shared';

   export async function fetchMyFeature(): Promise<MyFeatureResponse> {
     const res = await fetch('/api/my-feature');
     if (!res.ok) throw new Error('Failed to load my feature');
     return res.json();
   }
   ```

---

### Recipe 2: Adding a New Database Table or Column

When altering database schemas, always protect existing user databases by writing idempotent migrations in `server/src/db/db.ts`:

```typescript
// Inside initDatabase(dataDir: string):
// 1. Create table if not exists:
db.exec(`
  CREATE TABLE IF NOT EXISTS new_feature (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

// 2. Add column to existing table with try/catch fallback:
try {
  db.exec('ALTER TABLE tracks ADD COLUMN bpm REAL;');
} catch {
  // Ignore error if column already exists
}
```

---

### Recipe 3: Creating a New TUI Screen / View

Every major view in Quarter Note should be wrapped in `<TuiWindow>` to maintain the retro curses terminal design:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TuiWindow from '../components/TuiWindow.vue';
import TuiFrame from '../components/TuiFrame.vue';

const items = ref<string[]>([]);
</script>

<template>
  <TuiWindow 
    title="FEATURE TITLE" 
    badge="STATUS: OK" 
    hotkey="F7"
    variant="green"
  >
    <div class="space-y-4">
      <TuiFrame title="SUB-SECTION" variant="green">
        <p class="text-sm font-mono text-[#a3a3a3]">
          Terminal user interface content here...
        </p>
      </TuiFrame>
    </div>
  </TuiWindow>
</template>
```

---

### Recipe 4: Modifying the Audio Player Engine

The audio engine is encapsulated in `client/src/stores/player.ts`:
- Uses the HTML5 `Audio` constructor (`audio = new Audio()`).
- Exposes reactive refs (`currentTrack`, `isPlaying`, `currentTime`, `duration`, `playbackRate`, `queue`, `queueIndex`).
- Playback speed changes are handled by setting `audio.playbackRate = rate`.
- Volume is saved to `localStorage.getItem('qn_volume')`.

---

## 3. Strict Prohibitions for AI Agents

1. ❌ **Do NOT use CSS blur, backdrop-blur, or glassmorphism**: The interface must look like an authentic retro curses/BBS CRT screen.
2. ❌ **Do NOT install `better-sqlite3` or `sqlite3`**: The project strictly uses `node:sqlite` (`DatabaseSync` from Node.js 24).
3. ❌ **Do NOT add authentication or passwords**: Quarter Note is deliberately zero-login.
4. ❌ **Do NOT add `VOLUME` statements in `Dockerfile`**: This causes Docker daemon to create anonymous volumes that conflict with CasaOS.
5. ❌ **Do NOT break TypeScript strict mode**: Run `npm run build` to verify that all packages compile cleanly without type errors.
