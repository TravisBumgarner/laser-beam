// Palettes ported from Todo Today (src/renderer/styles/themes.ts) and Campaign Keep (wireframe + Faeblewood).
// Laser Beam is the stylesheet's own :root values; every other theme overrides those CSS variables.

type Palette = {
  mode: 'light' | 'dark'
  bg: string
  deep: string
  fg: string
  muted: string
  line: string
  accent: string
  accent2: string
  highlight: string
  onAccent: string
  ok: string
  err: string
  font: string
}

export type Theme = { id: string; name: string; swatches: [string, string, string]; palette: Palette | null }

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace'
const GROTESK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const ROUNDED = '"Comfortaa", "Quicksand", "Varela Round", "Trebuchet MS", system-ui, sans-serif'
const SERIF = '"Spectral", Georgia, serif'

const theme = (id: string, name: string, palette: Palette): Theme => ({
  id,
  name,
  swatches: [palette.bg, palette.accent, palette.accent2],
  palette,
})

export const DEFAULT_THEME = 'laser-beam'

export const THEMES: Theme[] = [
  { id: DEFAULT_THEME, name: 'Laser Beam', swatches: ['#1a1040', '#ff4fd8', '#3fe0ff'], palette: null },
  theme('graphite', 'Graphite', {
    mode: 'dark',
    bg: '#0f1216',
    deep: '#161b22',
    fg: '#d7dde5',
    muted: '#7d8794',
    line: '#242b34',
    accent: '#6cb6ff',
    accent2: '#57ab5a',
    highlight: '#6cb6ff',
    onAccent: '#08121f',
    ok: '#57ab5a',
    err: '#e5534b',
    font: MONO,
  }),
  theme('receipt', 'Receipt', {
    mode: 'light',
    bg: '#f4f1e9',
    deep: '#ece7db',
    fg: '#1c1a17',
    muted: '#7a746a',
    line: '#c8c1b1',
    accent: '#1c1a17',
    accent2: '#3e5c3a',
    highlight: '#8a5a1e',
    onAccent: '#f4f1e9',
    ok: '#3e5c3a',
    err: '#8a2b1e',
    font: MONO,
  }),
  theme('neon', 'Neon Arcade', {
    mode: 'dark',
    bg: '#0a0512',
    deep: '#150b24',
    fg: '#f2e9ff',
    muted: '#9a86c4',
    line: '#6a2fb0',
    accent: '#ff3df0',
    accent2: '#22f0e0',
    highlight: '#22f0e0',
    onAccent: '#12001a',
    ok: '#39ff9e',
    err: '#ff4d6d',
    font: MONO,
  }),
  theme('blueprint', 'Blueprint', {
    mode: 'dark',
    bg: '#0c2036',
    deep: '#102843',
    fg: '#d4e9ff',
    muted: '#6f97c4',
    line: '#274d78',
    accent: '#4db8ff',
    accent2: '#48d6a0',
    highlight: '#4db8ff',
    onAccent: '#04121f',
    ok: '#48d6a0',
    err: '#ff6b6b',
    font: MONO,
  }),
  theme('brutalist', 'Brutalist', {
    mode: 'light',
    bg: '#f4f1e8',
    deep: '#ece9dd',
    fg: '#1a1a1a',
    muted: '#6a6a6a',
    line: '#1a1a1a',
    accent: '#4d3dff',
    accent2: '#0a8a4a',
    highlight: '#4d3dff',
    onAccent: '#ffffff',
    ok: '#0a8a4a',
    err: '#cc2233',
    font: GROTESK,
  }),
  theme('pastel', 'Pastel Cloud', {
    mode: 'light',
    bg: '#f7f5ff',
    deep: '#f0ecff',
    fg: '#3f3a57',
    muted: '#9d98b8',
    line: '#ddd7f0',
    accent: '#9b8cff',
    accent2: '#ff9ec4',
    highlight: '#9b8cff',
    onAccent: '#ffffff',
    ok: '#68cfa0',
    err: '#ff7a90',
    font: ROUNDED,
  }),
  theme('todo-today', 'Todo Today', {
    mode: 'light',
    bg: '#eaf9ff',
    deep: '#dceff6',
    fg: '#43494c',
    muted: '#7e94a0',
    line: '#bcdae6',
    accent: '#4c7da5',
    accent2: '#18bda2',
    highlight: '#4c7da5',
    onAccent: '#ffffff',
    ok: '#18bda2',
    err: '#f1282e',
    font: ROUNDED,
  }),
  theme('wireframe-light', 'Wireframe Light', {
    mode: 'light',
    bg: '#fbfbfa',
    deep: '#f0f0ed',
    fg: '#1c1c1a',
    muted: '#77776f',
    line: '#cfcfc9',
    accent: '#3c3c38',
    accent2: '#6e6e68',
    highlight: '#3c3c38',
    onAccent: '#fbfbfa',
    ok: '#3c3c38',
    err: '#8a3c30',
    font: GROTESK,
  }),
  theme('wireframe-dark', 'Wireframe Dark', {
    mode: 'dark',
    bg: '#151513',
    deep: '#100f0e',
    fg: '#eae7df',
    muted: '#a29c91',
    line: '#39382f',
    accent: '#ddd8cd',
    accent2: '#8f8a80',
    highlight: '#ddd8cd',
    onAccent: '#151513',
    ok: '#ddd8cd',
    err: '#c98168',
    font: GROTESK,
  }),
  theme('faeblewood', 'Faeblewood', {
    mode: 'dark',
    bg: '#222025',
    deep: '#18171a',
    fg: '#ebe6dd',
    muted: '#a59fa8',
    line: '#34313a',
    accent: '#a9bb98',
    accent2: '#8e8893',
    highlight: '#a9bb98',
    onAccent: '#18171a',
    ok: '#a9bb98',
    err: '#e0937d',
    font: SERIF,
  }),
]

const vars = (p: Palette): Record<string, string> => ({
  '--bg': p.bg,
  '--bg-deep': p.deep,
  '--bg-gradient': `linear-gradient(${p.bg}, ${p.bg})`,
  '--fg': p.fg,
  '--muted': p.muted,
  '--line': p.line,
  '--pink': p.accent,
  '--violet': p.accent,
  '--cyan': p.highlight,
  '--yellow': p.accent2,
  '--accent': `color-mix(in srgb, ${p.accent} 22%, transparent)`,
  '--rainbow': `linear-gradient(90deg, ${p.accent}, ${p.accent2})`,
  '--glow': `0 0 0 1px ${p.highlight}`,
  '--ok': p.ok,
  '--err': p.err,
  '--shade': p.mode === 'dark' ? '#000000' : p.deep,
  '--tint': p.muted,
  '--on-accent': p.onAccent,
  '--accent-fill': p.accent,
  '--hero-opacity': '0',
  '--search-shadow': 'none',
  '--placeholder': p.muted,
  '--font': p.font,
})

const ALL_VARS = Object.keys(vars(THEMES[1].palette as Palette))

// Mirrors styles.css :root, so a preview can show Laser Beam while another theme is active.
const LASER_BEAM_VARS: Record<string, string> = {
  '--bg': '#1a1040',
  '--bg-deep': '#120a30',
  '--bg-gradient': 'linear-gradient(135deg, #2a1260 0%, #1a1040 45%, #10184a 100%)',
  '--fg': '#fbf4ff',
  '--muted': 'rgba(220, 200, 255, 0.55)',
  '--line': 'rgba(200, 150, 255, 0.16)',
  '--pink': '#ff4fd8',
  '--violet': '#9b5cff',
  '--cyan': '#3fe0ff',
  '--yellow': '#ffe94a',
  '--accent': 'linear-gradient(90deg, rgba(255, 79, 216, 0.35), rgba(155, 92, 255, 0.3))',
  '--rainbow': 'linear-gradient(90deg, #ff4fd8, #ff9a3f, #ffe94a, #5dff8f, #3fe0ff, #9b5cff)',
  '--glow': '0 0 0 1px rgba(63, 224, 255, 0.6), 0 0 14px rgba(63, 224, 255, 0.35)',
  '--ok': '#5dff8f',
  '--err': '#ff5c8a',
  '--shade': 'rgb(10, 5, 30)',
  '--tint': 'rgb(220, 200, 255)',
  '--on-accent': '#fbf4ff',
  '--accent-fill': 'linear-gradient(135deg, #ff4fd8, #9b5cff)',
  '--hero-opacity': '0.35',
  '--search-shadow': '0 1px 4px rgba(10, 5, 30, 0.9)',
  '--placeholder': 'rgba(255, 255, 255, 0.85)',
  '--font': '-apple-system, BlinkMacSystemFont, sans-serif',
}

// Inline style for previewing a theme inside one element; Laser Beam's are the stylesheet defaults.
export const themeStyle = (id: string): Record<string, string> => {
  const palette = THEMES.find((t) => t.id === id)?.palette
  return palette ? vars(palette) : LASER_BEAM_VARS
}

export const applyTheme = (id: string) => {
  const style = document.documentElement.style
  for (const name of ALL_VARS) style.removeProperty(name)
  const palette = THEMES.find((t) => t.id === id)?.palette
  style.colorScheme = ''
  if (!palette) return
  for (const [name, value] of Object.entries(vars(palette))) style.setProperty(name, value)
  style.colorScheme = palette.mode
}
