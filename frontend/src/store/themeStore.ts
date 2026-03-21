import { create } from 'zustand';

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  500: string;
  600: string;
  700: string;
  800: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  palette: ColorPalette;
}

export const PRESETS: ThemePreset[] = [
  {
    id: 'blue',
    name: 'Deep Blue',
    palette: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    palette: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b' },
  },
  {
    id: 'green',
    name: 'Forest Green',
    palette: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534' },
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    palette: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8' },
  },
  {
    id: 'indigo',
    name: 'Navy',
    palette: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3' },
  },
  {
    id: 'orange',
    name: 'Burnt Orange',
    palette: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412' },
  },
  {
    id: 'teal',
    name: 'Teal',
    palette: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59' },
  },
  {
    id: 'rose',
    name: 'Rose',
    palette: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239' },
  },
];

// --- Color math helpers ---

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Given any hex as the 600 shade, derive the full palette. */
export function generatePalette(hex600: string): ColorPalette {
  const [h, s, l] = hexToHsl(hex600);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return {
    50:  hslToHex(h, clamp(s * 0.20), clamp(97)),
    100: hslToHex(h, clamp(s * 0.30), clamp(93)),
    200: hslToHex(h, clamp(s * 0.50), clamp(87)),
    500: hslToHex(h, clamp(s * 0.95), clamp(l + 6)),
    600: hex600,
    700: hslToHex(h, clamp(s * 1.05), clamp(l - 8)),
    800: hslToHex(h, clamp(s * 1.10), clamp(l - 18)),
  };
}

/** Apply a palette to the document's CSS variables immediately. */
export function applyPalette(palette: ColorPalette) {
  const root = document.documentElement;
  root.style.setProperty('--p-50',  palette[50]);
  root.style.setProperty('--p-100', palette[100]);
  root.style.setProperty('--p-200', palette[200]);
  root.style.setProperty('--p-500', palette[500]);
  root.style.setProperty('--p-600', palette[600]);
  root.style.setProperty('--p-700', palette[700]);
  root.style.setProperty('--p-800', palette[800]);
}

// --- Store ---

const STORAGE_KEY = 'ylc_theme';

interface ThemeState {
  activePresetId: string;
  customColor: string;
  palette: ColorPalette;
  setPreset: (preset: ThemePreset) => void;
  setCustomColor: (hex: string) => void;
}

function loadSaved(): { presetId: string; customColor: string; palette: ColorPalette } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const defaultPalette = PRESETS[0].palette;
const saved = loadSaved();
const initialPalette = saved?.palette ?? defaultPalette;
const initialPresetId = saved?.presetId ?? 'blue';
const initialCustom = saved?.customColor ?? '#2563eb';

export const useThemeStore = create<ThemeState>((set) => ({
  activePresetId: initialPresetId,
  customColor: initialCustom,
  palette: initialPalette,

  setPreset: (preset) => {
    applyPalette(preset.palette);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId: preset.id, customColor: preset.palette[600], palette: preset.palette }));
    set({ activePresetId: preset.id, customColor: preset.palette[600], palette: preset.palette });
  },

  setCustomColor: (hex) => {
    const palette = generatePalette(hex);
    applyPalette(palette);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId: 'custom', customColor: hex, palette }));
    set({ activePresetId: 'custom', customColor: hex, palette });
  },
}));
