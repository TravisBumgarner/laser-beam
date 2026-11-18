import { execFile, spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { SearchFolder } from '../shared/api'

const DEFAULT: SearchFolder[] = [{ path: os.homedir(), depth: 1 }]

const file = () => path.join(app.getPath('userData'), 'search-folders.json')

const isFolder = (f: unknown): f is SearchFolder =>
  !!f &&
  typeof (f as SearchFolder).path === 'string' &&
  path.isAbsolute((f as SearchFolder).path) &&
  ((f as SearchFolder).depth === null ||
    (Number.isInteger((f as SearchFolder).depth) && ((f as SearchFolder).depth as number) >= 0))

const writeFolders = (folders: SearchFolder[]) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(folders, null, 2))
  return folders
}

export const setSearchFolders = (folders: SearchFolder[]) => {
  writeFolders(folders)
  buildFolderIndex()
  return folders
}

export const listSearchFolders = (): SearchFolder[] => {
  try {
    const data = JSON.parse(fs.readFileSync(file(), 'utf8'))
    if (Array.isArray(data)) return data.filter(isFolder)
  } catch {
    // First run: fall through and write the default.
  }
  return writeFolders(DEFAULT)
}

export const validFolders = (value: unknown): value is SearchFolder[] => Array.isArray(value) && value.every(isFolder)

// Dependency and hidden folders would drown out real results.
const NOISE = /\/(node_modules|\.[^/]+)(\/|$)/

const depthOf = (root: string, full: string) => path.relative(root, full).split(path.sep).length - 1

const wanted = (root: SearchFolder, full: string) =>
  full !== root.path && !NOISE.test(full) && (root.depth === null || depthOf(root.path, full) <= root.depth)

// In-memory index: folder path -> lowercased name. Built once from Spotlight, then kept current by file watchers.
let index = new Map<string, string>()
let watchers: fs.FSWatcher[] = []
let generation = 0
let indexing = false

// Emits 'indexing' with true/false as the index starts and finishes building.
export const folderIndexEvents = new EventEmitter()
export const isIndexing = () => indexing

const setIndexing = (value: boolean) => {
  indexing = value
  folderIndexEvents.emit('indexing', value)
}

const add = (target: Map<string, string>, full: string) => target.set(full, path.basename(full).toLowerCase())

const load = (root: SearchFolder, target: Map<string, string>, gen: number) =>
  new Promise<void>((resolve) => {
    let buffer = ''
    const child = spawn('mdfind', ['-onlyin', root.path, 'kMDItemContentType == "public.folder"'])
    child.stdout.on('data', (chunk: Buffer) => {
      if (gen !== generation) return child.kill()
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) if (line && wanted(root, line)) add(target, line)
    })
    child.on('error', () => resolve())
    child.on('close', () => resolve())
  })

const onChange = (root: SearchFolder, filename: string | null) => {
  if (!filename) return
  const full = path.join(root.path, filename)
  if (!wanted(root, full)) return
  fs.stat(full, (error, stat) => {
    if (!error && stat.isDirectory()) return add(index, full)
    if (error?.code !== 'ENOENT') return
    index.delete(full)
    for (const key of index.keys()) if (key.startsWith(`${full}/`)) index.delete(key)
  })
}

export const buildFolderIndex = async () => {
  const gen = ++generation
  setIndexing(true)
  const roots = listSearchFolders()
  for (const w of watchers) w.close()
  watchers = roots.flatMap((root) => {
    try {
      return [fs.watch(root.path, { recursive: true }, (_event, filename) => onChange(root, filename))]
    } catch {
      return []
    }
  })
  // The first build fills the live index so results show up while it loads; rebuilds swap in when done.
  const target = index.size === 0 ? index : new Map<string, string>()
  await Promise.all(roots.map((root) => load(root, target, gen)))
  if (gen !== generation) return
  index = target
  setIndexing(false)
}

export const searchFolders = (text: string) => {
  const q = text.toLowerCase()
  const found: string[] = []
  for (const [full, name] of index) if (name.includes(q)) found.push(full)
  return found
}

// Spotlight's last-opened time per folder (0 when unknown), fetched in one mdls call.
export const lastUsed = (paths: string[]) =>
  new Promise<Map<string, number>>((resolve) => {
    const result = new Map<string, number>()
    if (paths.length === 0) return resolve(result)
    execFile('mdls', ['-name', 'kMDItemLastUsedDate', '-raw', ...paths], { timeout: 1000 }, (_error, stdout) => {
      const values = String(stdout ?? '').split('\0')
      // A vanished folder drops its value and misaligns the list; skip dates then.
      if (values.length !== paths.length) return resolve(result)
      paths.forEach((p, i) => {
        const time = Date.parse(values[i].replace(' ', 'T').replace(' +0000', 'Z'))
        result.set(p, Number.isNaN(time) ? 0 : time)
      })
      resolve(result)
    })
  })
