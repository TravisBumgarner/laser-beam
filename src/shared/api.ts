export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ScriptResult = { stdout: string; stderr: string; code: number | null }

export type RunIn = 'internal' | 'terminal'

export const TERMINALS = ['Terminal', 'iTerm', 'Ghostty', 'kitty', 'WezTerm', 'Alacritty'] as const

export type TerminalApp = (typeof TERMINALS)[number]

// A value asked for at run time and injected into the command wherever {{name}} appears.
export type ScriptParam = { name: string; default: string }

export const PARAM_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

export const validParams = (value: unknown): value is ScriptParam[] =>
  Array.isArray(value) &&
  value.every((p) => p && typeof p.name === 'string' && PARAM_NAME.test(p.name) && typeof p.default === 'string')

// Quotes a value to suit where {{name}} sits, so it's always one literal word that can't break or extend the command:
// inside "…" it's escaped, inside '…' it closes and reopens the quote, and anywhere else it's single-quoted.
const quoteFor = (state: 'none' | 'single' | 'double', value: string) => {
  if (state === 'double') return value.replace(/[\\"$`]/g, '\\$&')
  if (state === 'single') return value.replaceAll("'", "'\\''")
  return `'${value.replaceAll("'", "'\\''")}'`
}

export const fillParams = (command: string, params: ScriptParam[], values: string[]) => {
  const byName = new Map(params.map((p, i) => [p.name, values[i] ?? '']))
  let state: 'none' | 'single' | 'double' = 'none'
  let out = ''
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]
    const match = /^\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/.exec(command.slice(i, i + 200))
    if (match && byName.has(match[1])) {
      out += quoteFor(state, byName.get(match[1]) as string)
      i += match[0].length - 1
      continue
    }
    out += ch
    if (ch === '\\' && state !== 'single') {
      out += command[i + 1] ?? ''
      i++
    } else if (ch === "'" && state !== 'double') state = state === 'single' ? 'none' : 'single'
    else if (ch === '"' && state !== 'single') state = state === 'double' ? 'none' : 'double'
  }
  return out
}

export type PermissionId = 'accessibility' | 'files' | 'system-events' | 'finder' | 'bluetooth' | 'terminal' | 'iterm'

// 'unknown' means macOS hasn't been asked yet.
export type PermissionStatus = 'granted' | 'missing' | 'unknown'

export type Permission = { id: PermissionId; label: string; why: string; status: PermissionStatus }

export type SavedScript = {
  id: string
  name: string
  command: string
  runIn: RunIn
  terminal: TerminalApp
  params: ScriptParam[]
}

export type ScriptDraft = Omit<SavedScript, 'id'> & { id: string | null }

export type SaveResult = { id: string; scripts: SavedScript[] }

export type Position =
  | 'full'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type Layout = '1x2' | '2x1' | '2x2'

export const LAYOUT_POSITIONS: Record<Layout, Position[]> = {
  '1x2': ['left', 'right'],
  '2x1': ['top', 'bottom'],
  '2x2': ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
}

export type PresetStep = { app: string; position: Position; newWindow: boolean }

export type Preset = { id: string; name: string; layout: Layout; steps: PresetStep[] }

export type PresetDraft = { id: string | null; name: string; layout: Layout; steps: PresetStep[] }

export type PresetSaveResult = { id: string; presets: Preset[] }

export type AppResult = {
  name: string
  path: string
  icon: string
  kind: 'app' | 'setting' | 'folder' | 'action'
  boosted: boolean
  running: boolean
}

export type SavedChat = { id: string; title: string; messages: ChatMessage[] }

export type ChatResult = { ok: true; text: string; sessionId: string } | { ok: false; error: string }

export type ClipEntry = { text: string; copiedAt: number }

// depth null = unlimited; 0 = only the folder's direct subfolders.
export type SearchFolder = { path: string; depth: number | null }

export type Settings = {
  hotkey: string
  launchAtLogin: boolean
  searchFolders: SearchFolder[]
  theme: string
  todoInstalled: boolean
}

export type BackupFrequency = 'off' | 'daily' | 'weekly' | 'monthly'

// weekday: 0 = Sunday. Monthly backups run on the 1st.
export type BackupSchedule = { frequency: BackupFrequency; weekday: number; folder: string; lastRun: number | null }

export type Api = {
  hide: () => void
  onReset: (cb: () => void) => () => void
  resize: (height: number) => void
  searchApps: (query: string) => Promise<AppResult[]>
  openApp: (path: string, query?: string, newWindow?: boolean) => Promise<void>
  clearPick: (query: string, path: string) => Promise<void>
  searchWeb: (query: string) => Promise<void>
  getSettings: () => Promise<Settings>
  setLaunchAtLogin: (enabled: boolean) => Promise<Settings>
  runScript: (command: string) => Promise<ScriptResult>
  runInTerminal: (command: string, terminal: TerminalApp) => Promise<string | null>
  setSearchFolders: (folders: SearchFolder[]) => Promise<Settings>
  setTheme: (id: string) => Promise<Settings>
  getTodoToday: () => void
  setHotkey: (key: string) => Promise<string | null>
  openKeyboardShortcuts: () => void
  getAppInfo: () => Promise<{ version: string; isDev: boolean; notesUnseen: boolean; setupNeeded: boolean }>
  markNotesSeen: () => Promise<void>
  listPermissions: () => Promise<Permission[]>
  requestPermission: (id: PermissionId) => Promise<Permission[]>
  completeSetup: () => Promise<void>
  onThemeChange: (cb: (id: string) => void) => () => void
  isIndexing: () => Promise<boolean>
  onIndexing: (cb: (indexing: boolean) => void) => () => void
  pickFolder: () => Promise<string | null>
  listScripts: () => Promise<SavedScript[]>
  saveScript: (draft: ScriptDraft) => Promise<SaveResult>
  openSettings: () => void
  addTodo: (title: string) => Promise<string | null>
  deleteScript: (id: string) => Promise<SavedScript[]>
  exportAll: () => Promise<string | null>
  importAll: () => Promise<string | null>
  getBackupSchedule: () => Promise<BackupSchedule>
  setBackupSchedule: (schedule: Omit<BackupSchedule, 'lastRun'>) => Promise<BackupSchedule>
  listPresets: () => Promise<Preset[]>
  savePreset: (draft: PresetDraft) => Promise<PresetSaveResult>
  deletePreset: (id: string) => Promise<Preset[]>
  runPreset: (id: string) => Promise<string | null>
  chat: (prompt: string, sessionId: string | null) => Promise<ChatResult>
  listChats: () => Promise<SavedChat[]>
  listClips: () => Promise<ClipEntry[]>
  pasteClip: (text: string) => Promise<void>
  deleteClip: (text: string) => Promise<ClipEntry[]>
  deleteChat: (id: string) => Promise<SavedChat[]>
}
