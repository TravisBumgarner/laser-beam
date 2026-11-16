import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { SavedScript, SaveResult, ScriptDraft, ScriptResult } from '../shared/api'

export const runScript = (command: string) =>
  new Promise<ScriptResult>((resolve) => {
    execFile(
      '/bin/zsh',
      ['-lc', command],
      { cwd: os.homedir(), timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
        resolve({ stdout, stderr: stderr || (error && !stderr ? error.message : ''), code })
      },
    )
  })

const file = () => path.join(app.getPath('userData'), 'scripts.json')

export const listScripts = (): SavedScript[] => {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8'))
  } catch {
    return []
  }
}

const write = (scripts: SavedScript[]) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(scripts, null, 2))
  return scripts
}

export const saveScript = ({ id, name, command }: ScriptDraft): SaveResult => {
  const scripts = listScripts()
  if (id && scripts.some((s) => s.id === id)) {
    return { id, scripts: write(scripts.map((s) => (s.id === id ? { id, name, command } : s))) }
  }
  const newId = randomUUID()
  return { id: newId, scripts: write([...scripts, { id: newId, name, command }]) }
}

export const replaceScripts = (scripts: SavedScript[]) => write(scripts)

export const deleteScript = (id: string) => write(listScripts().filter((s) => s.id !== id))
