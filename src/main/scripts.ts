import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import {
  type SavedScript,
  type SaveResult,
  type ScriptDraft,
  type ScriptResult,
  TERMINALS,
  type TerminalApp,
} from '../shared/api'

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

const exec = (cmd: string, args: string[]) =>
  new Promise<string | null>((resolve) =>
    execFile(cmd, args, (error, _stdout, stderr) => resolve(error ? stderr.trim() || error.message : null)),
  )

const appleString = (s: string) => `"${s.replace(/[\\"]/g, '\\$&')}"`

// Terminal and iTerm get the command typed into a new window's shell, so it shows up like you typed it.
// Others run a throwaway script that echoes each line (zsh -v) and then drops into a login shell.
export const runInTerminal = async (command: string, terminal: TerminalApp): Promise<string | null> => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'laser-beam-'))
  const script = path.join(dir, 'script.command')
  fs.writeFileSync(script, `#!/bin/zsh -l\ncd ~\nset -v\n${command}\nset +v\nexec /bin/zsh -l\n`, { mode: 0o700 })
  const error = await (() => {
    switch (terminal) {
      case 'Terminal':
        return exec('osascript', [
          '-e',
          'tell application "Terminal"',
          '-e',
          'activate',
          '-e',
          `do script ${appleString(command)}`,
          '-e',
          'end tell',
        ])
      case 'iTerm':
        return exec('osascript', [
          '-e',
          'tell application "iTerm"',
          '-e',
          'activate',
          '-e',
          'set w to (create window with default profile)',
          '-e',
          `tell current session of w to write text ${appleString(command)}`,
          '-e',
          'end tell',
        ])
      case 'Ghostty':
        return exec('open', ['-na', 'Ghostty', '--args', '-e', script])
      case 'kitty':
        return exec('open', ['-na', 'kitty', '--args', script])
      case 'WezTerm':
        return exec('open', ['-na', 'WezTerm', '--args', 'start', '--', script])
      case 'Alacritty':
        return exec('open', ['-na', 'Alacritty', '--args', '-e', script])
    }
  })()
  return error ? `Couldn't open ${terminal}: ${error}` : null
}

const normalize = (s: Partial<SavedScript> & SavedScript): SavedScript => ({
  id: s.id,
  name: s.name,
  command: s.command,
  runIn: s.runIn === 'terminal' ? 'terminal' : 'internal',
  terminal: TERMINALS.includes(s.terminal) ? s.terminal : 'Terminal',
})

const file = () => path.join(app.getPath('userData'), 'scripts.json')

export const listScripts = (): SavedScript[] => {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8')).map(normalize)
  } catch {
    return []
  }
}

const write = (scripts: SavedScript[]) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(scripts, null, 2))
  return scripts
}

export const saveScript = ({ id, ...fields }: ScriptDraft): SaveResult => {
  const scripts = listScripts()
  if (id && scripts.some((s) => s.id === id)) {
    return { id, scripts: write(scripts.map((s) => (s.id === id ? { id, ...fields } : s))) }
  }
  const newId = randomUUID()
  return { id: newId, scripts: write([...scripts, { id: newId, ...fields }]) }
}

export const replaceScripts = (scripts: SavedScript[]) => write(scripts)

export const deleteScript = (id: string) => write(listScripts().filter((s) => s.id !== id))
