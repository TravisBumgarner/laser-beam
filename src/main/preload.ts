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
  openApp: (path) => ipcRenderer.invoke('apps:open', path),
  searchWeb: (query) => ipcRenderer.invoke('web:search', query),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  runScript: (command) => ipcRenderer.invoke('script:run', command),
  listScripts: () => ipcRenderer.invoke('scripts:list'),
  saveScript: (draft) => ipcRenderer.invoke('scripts:save', draft),
  openSettings: () => ipcRenderer.send('settings:open'),
  addTodo: (title) => ipcRenderer.invoke('todo:add', title),
  deleteScript: (id) => ipcRenderer.invoke('scripts:delete', id),
  exportAll: () => ipcRenderer.invoke('backup:export'),
  importAll: () => ipcRenderer.invoke('backup:import'),
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
