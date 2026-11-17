import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app, type BrowserWindow, dialog } from 'electron'
import type { BackupSchedule, SavedScript } from '../shared/api'
import { listScripts, replaceScripts } from './scripts'

type Backup = { version: 1; scripts: SavedScript[] }

const isScript = (s: unknown): s is SavedScript =>
  !!s &&
  typeof (s as SavedScript).id === 'string' &&
  typeof (s as SavedScript).name === 'string' &&
  typeof (s as SavedScript).command === 'string'

const writeBackup = (filePath: string) => {
  const backup: Backup = { version: 1, scripts: listScripts() }
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
}

export const exportAll = async (win: BrowserWindow): Promise<string | null> => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'laser-beam-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return null
  writeBackup(filePath)
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

const FREQUENCIES = ['off', 'daily', 'weekly', 'monthly']

const scheduleFile = () => path.join(app.getPath('userData'), 'backup-schedule.json')

// startedAt marks when the schedule was first set up, so the first backup waits for the next due day.
type Stored = BackupSchedule & { startedAt: number }

const writeSchedule = (stored: Stored): BackupSchedule => {
  fs.mkdirSync(path.dirname(scheduleFile()), { recursive: true })
  fs.writeFileSync(scheduleFile(), JSON.stringify(stored, null, 2))
  const { startedAt: _, ...schedule } = stored
  return schedule
}

export const validSchedule = (value: unknown): value is Omit<BackupSchedule, 'lastRun'> => {
  const s = value as BackupSchedule
  return (
    !!s &&
    FREQUENCIES.includes(s.frequency) &&
    Number.isInteger(s.weekday) &&
    s.weekday >= 0 &&
    s.weekday <= 6 &&
    typeof s.folder === 'string' &&
    path.isAbsolute(s.folder)
  )
}

const readStored = (): Stored => {
  try {
    const data = JSON.parse(fs.readFileSync(scheduleFile(), 'utf8'))
    if (validSchedule(data)) {
      const { frequency, weekday, folder } = data
      const extra = data as Partial<Stored>
      return {
        frequency,
        weekday,
        folder,
        lastRun: typeof extra.lastRun === 'number' ? extra.lastRun : null,
        startedAt: typeof extra.startedAt === 'number' ? extra.startedAt : 0,
      }
    }
  } catch {
    // Missing or unreadable: write the default.
  }
  const stored: Stored = {
    frequency: 'weekly',
    weekday: 1,
    folder: path.join(os.homedir(), 'Documents', 'Laser Beam Backups'),
    lastRun: null,
    startedAt: Date.now(),
  }
  writeSchedule(stored)
  return stored
}

export const getSchedule = (): BackupSchedule => {
  const { startedAt: _, ...schedule } = readStored()
  return schedule
}

export const setSchedule = ({ frequency, weekday, folder }: Omit<BackupSchedule, 'lastRun'>) =>
  writeSchedule({ ...readStored(), frequency, weekday, folder })

// Midnight of the most recent day a backup was due, or null when backups are off.
const lastDue = ({ frequency, weekday }: BackupSchedule, now = new Date()) => {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (frequency === 'daily') return day.getTime()
  if (frequency === 'weekly') return day.getTime() - ((day.getDay() - weekday + 7) % 7) * 86_400_000
  if (frequency === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return null
}

const runIfDue = () => {
  const schedule = readStored()
  const due = lastDue(schedule)
  if (due === null || Math.max(schedule.lastRun ?? 0, schedule.startedAt) >= due) return
  try {
    fs.mkdirSync(schedule.folder, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 10)
    writeBackup(path.join(schedule.folder, `laser-beam-backup-${stamp}.json`))
    writeSchedule({ ...schedule, lastRun: Date.now() })
  } catch (error) {
    console.error('Automatic backup failed', error)
  }
}

// Checks at startup and hourly, so a backup missed while the Mac was off runs once it's back.
export const startAutoBackup = () => {
  runIfDue()
  setInterval(runIfDue, 60 * 60 * 1000).unref()
}
