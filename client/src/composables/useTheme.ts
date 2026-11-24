import { ref } from 'vue';

export type ThemeName = 'cyan' | 'green' | 'amber' | 'win98';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  tag: string;
}

export const availableThemes: ThemeOption[] = [
  { id: 'cyan', name: 'Cyber Cyan (BBS)', tag: 'CYAN' },
  { id: 'green', name: 'Phosphor CRT (VT220)', tag: 'GREEN' },
  { id: 'amber', name: 'Amber CRT (Hercules)', tag: 'AMBER' },
  { id: 'win98', name: 'Windows 98 Classic', tag: 'WIN98' },
];

export const currentTheme = ref<ThemeName>('cyan');

export function initTheme(): void {
  const saved = localStorage.getItem('quarter_note_theme') as ThemeName | null;
  if (saved && availableThemes.some(t => t.id === saved)) {
    currentTheme.value = saved;
  }
  applyTheme(currentTheme.value);
}

export function setTheme(theme: ThemeName): void {
  currentTheme.value = theme;
  localStorage.setItem('quarter_note_theme', theme);
  applyTheme(theme);
}

function applyTheme(theme: ThemeName): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
