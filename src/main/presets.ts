import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { app, screen } from 'electron'
import type { Position, Preset, PresetDraft, PresetSaveResult } from '../shared/api'
import { findApp } from './apps'

const file = () => path.join(app.getPath('userData'), 'presets.json')

export const listPresets = (): Preset[] => {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8'))
  } catch {
    return []
  }
}

const write = (presets: Preset[]) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(presets, null, 2))
  return presets
}

export const savePreset = ({ id, name, layout, steps }: PresetDraft): PresetSaveResult => {
  const presets = listPresets()
  if (id && presets.some((p) => p.id === id)) {
    return { id, presets: write(presets.map((p) => (p.id === id ? { id, name, layout, steps } : p))) }
  }
  const newId = randomUUID()
  return { id: newId, presets: write([...presets, { id: newId, name, layout, steps }]) }
}

export const deletePreset = (id: string) => write(listPresets().filter((p) => p.id !== id))

const run = (cmd: string, args: string[]) =>
  new Promise<string>((resolve, reject) => {
    execFile(cmd, args, { timeout: 20_000 }, (error, stdout, stderr) =>
      error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout.trim()),
    )
  })

// Opens the app (optionally a new window), waits for the window, then moves/resizes it.
const PLACE = `
on run argv
  set appPath to item 1 of argv
  set bid to item 2 of argv
  set newWin to (item 3 of argv) is "1"
  set {x, y, w, h} to {(item 4 of argv) as integer, (item 5 of argv) as integer, (item 6 of argv) as integer, (item 7 of argv) as integer}
  set startCount to 0
  tell application "System Events"
    if exists (first process whose bundle identifier is bid) then set startCount to count windows of (first process whose bundle identifier is bid)
  end tell
  do shell script (item 8 of argv)
  repeat 100 times
    tell application "System Events"
      if exists (first process whose bundle identifier is bid) then
        set n to count windows of (first process whose bundle identifier is bid)
        if (newWin and n > startCount) or ((not newWin) and n > 0) then exit repeat
      end if
    end tell
    delay 0.1
  end repeat
  delay 0.2
  tell application "System Events"
    tell (first process whose bundle identifier is bid)
      set frontmost to true
      set position of window 1 to {x, y}
      set size of window 1 to {w, h}
    end tell
  end tell
end run
`

const frame = (position: Position) => {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea
  const halfW = Math.round(width / 2)
  const halfH = Math.round(height / 2)
  switch (position) {
    case 'left':
      return [x, y, halfW, height]
    case 'right':
      return [x + halfW, y, width - halfW, height]
    case 'top':
      return [x, y, width, halfH]
    case 'bottom':
      return [x, y + halfH, width, height - halfH]
    case 'top-left':
      return [x, y, halfW, halfH]
    case 'top-right':
      return [x + halfW, y, width - halfW, halfH]
    case 'bottom-left':
      return [x, y + halfH, halfW, height - halfH]
    case 'bottom-right':
      return [x + halfW, y + halfH, width - halfW, height - halfH]
    default:
      return [x, y, width, height]
  }
}

const sh = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`

const launchCommand = async (appPath: string, bid: string, newWindow: boolean) => {
  if (!newWindow) return `open -a ${sh(appPath)}`
  // Firefox can't run a second instance on the same profile; its binary forwards --new-window instead.
  if (bid.startsWith('org.mozilla.')) {
    const exe = await run('plutil', [
      '-extract',
      'CFBundleExecutable',
      'raw',
      path.join(appPath, 'Contents/Info.plist'),
    ])
    return `${sh(path.join(appPath, 'Contents/MacOS', exe))} --new-window >/dev/null 2>&1 &`
  }
  return `open -na ${sh(appPath)} --args --new-window`
}

export const runPreset = async (preset: Preset): Promise<string | null> => {
  try {
    for (const step of preset.steps) {
      const found = findApp(step.app)
      if (!found) return `App not found: ${step.app}`
      const bid = await run('mdls', ['-name', 'kMDItemCFBundleIdentifier', '-raw', found.path])
      if (!bid || bid === '(null)') return `No bundle id for ${found.name}`
      await run('osascript', [
        '-e',
        PLACE,
        found.path,
        bid,
        step.newWindow ? '1' : '0',
        ...frame(step.position).map(String),
        await launchCommand(found.path, bid, step.newWindow),
      ])
    }
    return null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return /not allowed|assistive|-1719|-25211/i.test(msg)
      ? 'Grant Laser Beam Accessibility access in System Settings → Privacy & Security → Accessibility.'
      : msg
  }
}
