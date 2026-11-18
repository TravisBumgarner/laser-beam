import { contextBridge, ipcRenderer } from 'electron'
import type { Api } from '../shared/api'

const api: Api = {
  hide: () => ipcRenderer.send('window:hide'),
  onReset: (cb) => {
    const listener = () => cb()
    ipcRenderer.on('window:reset', listener)
    return () => ipcRenderer.removeListener('window:reset', listener)
  },
  resize: (height) => ipcRenderer.send('window:resize', height),
  searchApps: (query) => ipcRenderer.invoke('apps:search', query),
  openApp: (path, query) => ipcRenderer.invoke('apps:open', path, query),
  clearPick: (query, path) => ipcRenderer.invoke('history:clear', query, path),
  searchWeb: (query) => ipcRenderer.invoke('web:search', query),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke('settings:launchAtLogin', enabled),
  runScript: (command) => ipcRenderer.invoke('script:run', command),
  runInTerminal: (command, terminal) => ipcRenderer.invoke('script:terminal', command, terminal),
  setSearchFolders: (folders) => ipcRenderer.invoke('settings:searchFolders', folders),
  setTheme: (id) => ipcRenderer.invoke('settings:theme', id),
  getTodoToday: () => ipcRenderer.send('todo:get'),
  setHotkey: (key) => ipcRenderer.invoke('settings:hotkey', key),
  openKeyboardShortcuts: () => ipcRenderer.send('keyboard:shortcuts'),
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  markNotesSeen: () => ipcRenderer.invoke('app:notesSeen'),
  listPermissions: () => ipcRenderer.invoke('permissions:list'),
  requestPermission: (id) => ipcRenderer.invoke('permissions:request', id),
  completeSetup: () => ipcRenderer.invoke('setup:complete'),
  onThemeChange: (cb) => {
    const listener = (_e: unknown, id: string) => cb(id)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  },
  isIndexing: () => ipcRenderer.invoke('folders:indexing'),
  onIndexing: (cb) => {
    const listener = (_e: unknown, value: boolean) => cb(value)
    ipcRenderer.on('folders:indexing', listener)
    return () => ipcRenderer.removeListener('folders:indexing', listener)
  },
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  listScripts: () => ipcRenderer.invoke('scripts:list'),
  saveScript: (draft) => ipcRenderer.invoke('scripts:save', draft),
  openSettings: () => ipcRenderer.send('settings:open'),
  addTodo: (title) => ipcRenderer.invoke('todo:add', title),
  deleteScript: (id) => ipcRenderer.invoke('scripts:delete', id),
  exportAll: () => ipcRenderer.invoke('backup:export'),
  importAll: () => ipcRenderer.invoke('backup:import'),
  getBackupSchedule: () => ipcRenderer.invoke('backup:schedule:get'),
  setBackupSchedule: (schedule) => ipcRenderer.invoke('backup:schedule:set', schedule),
  listPresets: () => ipcRenderer.invoke('presets:list'),
  savePreset: (draft) => ipcRenderer.invoke('presets:save', draft),
  deletePreset: (id) => ipcRenderer.invoke('presets:delete', id),
  runPreset: (id) => ipcRenderer.invoke('presets:run', id),
  chat: (prompt, sessionId) => ipcRenderer.invoke('ai:chat', prompt, sessionId),
  listChats: () => ipcRenderer.invoke('ai:list'),
  listClips: () => ipcRenderer.invoke('clipboard:list'),
  pasteClip: (text) => ipcRenderer.invoke('clipboard:paste', text),
  deleteClip: (text) => ipcRenderer.invoke('clipboard:delete', text),
  deleteChat: (id) => ipcRenderer.invoke('ai:delete', id),
}

contextBridge.exposeInMainWorld('api', api)
