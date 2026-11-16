export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ScriptResult = { stdout: string; stderr: string; code: number | null }

export type SavedScript = { id: string; name: string; command: string }

export type ScriptDraft = { id: string | null; name: string; command: string }

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

export type AppResult = { name: string; path: string; icon: string; kind: 'app' | 'setting' }

export type SavedChat = { id: string; title: string; messages: ChatMessage[] }

export type ChatResult = { ok: true; text: string; sessionId: string } | { ok: false; error: string }

export type ClipEntry = { text: string; copiedAt: number }

export type Settings = { hotkey: string; launchAtLogin: boolean }

export type Api = {
  hide: () => void
  onReset: (cb: () => void) => () => void
  resize: (height: number) => void
  searchApps: (query: string) => Promise<AppResult[]>
  openApp: (path: string) => Promise<void>
  searchWeb: (query: string) => Promise<void>
  getSettings: () => Promise<Settings>
  setLaunchAtLogin: (enabled: boolean) => Promise<Settings>
  runScript: (command: string) => Promise<ScriptResult>
  listScripts: () => Promise<SavedScript[]>
  saveScript: (draft: ScriptDraft) => Promise<SaveResult>
  openSettings: () => void
  addTodo: (title: string) => Promise<string | null>
  deleteScript: (id: string) => Promise<SavedScript[]>
  exportAll: () => Promise<string | null>
  importAll: () => Promise<string | null>
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
