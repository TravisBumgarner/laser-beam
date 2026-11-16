import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { nativeImage, shell } from 'electron'
import type { AppResult } from '../shared/api'
import { SETTINGS_PANES } from './settingsPanes'

const SETTINGS_APP = '/System/Applications/System Settings.app'

const ROOTS = [
  '/Applications',
  '/Applications/Utilities',
  '/System/Applications',
  '/System/Applications/Utilities',
  path.join(os.homedir(), 'Applications'),
]

let apps: { name: string; path: string }[] = []
const icons = new Map<string, string>()

const scan = () => {
  const found = new Map<string, { name: string; path: string }>()
  for (const root of ROOTS) {
    let entries: fs.Dirent[] = []
    try {
      entries = fs.readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.name.endsWith('.app')) continue
      const full = path.join(root, entry.name)
      found.set(full, { name: entry.name.slice(0, -4), path: full })
    }
  }
  apps = [...found.values()].sort((a, b) => a.name.localeCompare(b.name))
}

let timer: NodeJS.Timeout | null = null
const rescanSoon = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(scan, 300)
}

export const watchApps = () => {
  scan()
  for (const root of ROOTS) {
    try {
      fs.watch(root, rescanSoon)
    } catch {
      // Folder doesn't exist on this machine.
    }
  }
}

const score = (name: string, query: string) => {
  const n = name.toLowerCase()
  if (n === query) return 0
  if (n.startsWith(query)) return 1
  if (n.split(/[\s\-.]+/).some((word) => word.startsWith(query))) return 2
  if (n.includes(query)) return 3
  let i = 0
  for (const ch of n) if (ch === query[i]) i++
  return i === query.length ? 4 : -1
}

const iconFor = async (appPath: string) => {
  const cached = icons.get(appPath)
  if (cached) return cached
  try {
    const url = (await nativeImage.createThumbnailFromPath(appPath, { width: 64, height: 64 })).toDataURL()
    icons.set(appPath, url)
    return url
  } catch {
    return ''
  }
}

export const searchApps = async (query: string, limit = 8): Promise<AppResult[]> => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const ranked = [
    ...apps.map((a) => ({ ...a, kind: 'app' as const })),
    ...SETTINGS_PANES.map((p) => ({ ...p, kind: 'setting' as const })),
  ]
    .map((a) => ({ ...a, score: score(a.name, q) }))
    .filter((a) => a.score >= 0)
    .sort((a, b) => a.score - b.score || a.name.length - b.name.length)
    .slice(0, limit)
  return Promise.all(
    ranked.map(async (a) => ({
      name: a.name,
      path: a.path,
      kind: a.kind,
      icon: await iconFor(a.kind === 'setting' ? SETTINGS_APP : a.path),
    })),
  )
}

export const openApp = async (target: string) => {
  if (SETTINGS_PANES.some((p) => p.path === target)) return shell.openExternal(target)
  if (!apps.some((a) => a.path === target)) throw new Error('Unknown app')
  await shell.openPath(target)
}

export const findApp = (name: string) => {
  const q = name.trim().toLowerCase()
  return apps.find((a) => a.name.toLowerCase() === q || a.path.toLowerCase() === q)
}
