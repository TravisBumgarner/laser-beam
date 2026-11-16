import fs from 'node:fs'
import { type BrowserWindow, dialog } from 'electron'
import type { SavedScript } from '../shared/api'
import { listScripts, replaceScripts } from './scripts'

type Backup = { version: 1; scripts: SavedScript[] }

const isScript = (s: unknown): s is SavedScript =>
  !!s &&
  typeof (s as SavedScript).id === 'string' &&
  typeof (s as SavedScript).name === 'string' &&
  typeof (s as SavedScript).command === 'string'

export const exportAll = async (win: BrowserWindow): Promise<string | null> => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'laser-beam-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return null
  const backup: Backup = { version: 1, scripts: listScripts() }
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
  return `Exported to ${filePath}`
}

export const importAll = async (win: BrowserWindow): Promise<string | null> => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePaths[0]) return null
  const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
  if (data?.version !== 1 || !Array.isArray(data.scripts) || !data.scripts.every(isScript)) {
    throw new Error('Not a valid Laser Beam backup')
  }
  replaceScripts(data.scripts)
  return `Imported ${data.scripts.length} scripts`
}
