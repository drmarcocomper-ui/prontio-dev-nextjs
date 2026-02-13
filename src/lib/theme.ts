export type ThemeName = "sky" | "blue" | "violet" | "emerald" | "rose" | "amber";

export const THEME_OPTIONS: { key: ThemeName; label: string; swatch: string }[] = [
  { key: "sky", label: "Sky", swatch: "bg-sky-500" },
  { key: "blue", label: "Azul", swatch: "bg-blue-500" },
  { key: "violet", label: "Violeta", swatch: "bg-violet-500" },
  { key: "emerald", label: "Esmeralda", swatch: "bg-emerald-500" },
  { key: "rose", label: "Rosa", swatch: "bg-rose-500" },
  { key: "amber", label: "Âmbar", swatch: "bg-amber-500" },
];

export const DEFAULT_THEME: ThemeName = "sky";

export const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((t) => t.key));
