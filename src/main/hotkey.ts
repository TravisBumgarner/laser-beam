import fs from 'node:fs'
import path from 'node:path'
import { app, globalShortcut } from 'electron'

export const HOTKEYS = ['Alt+Space', 'Command+Space'] as const
export type Hotkey = (typeof HOTKEYS)[number]

const DEFAULT: Hotkey = 'Alt+Space'

const file = () => path.join(app.getPath('userData'), 'hotkey.json')

const saved = (): Hotkey => {
  try {
    const { key } = JSON.parse(fs.readFileSync(file(), 'utf8'))
    if (HOTKEYS.includes(key)) return key
  } catch {
    // Not chosen yet.
  }
  return DEFAULT
}

let active: Hotkey = DEFAULT

export const currentHotkey = () => active

// ⌘Space only registers once Spotlight's shortcut is turned off; if it's taken, fall back to ⌥Space.
export const registerHotkey = (onPress: () => void, key: Hotkey = saved()): string | null => {
  globalShortcut.unregisterAll()
  if (globalShortcut.register(key, onPress)) {
    active = key
    fs.mkdirSync(path.dirname(file()), { recursive: true })
    fs.writeFileSync(file(), JSON.stringify({ key }))
    return null
  }
  if (key !== DEFAULT) globalShortcut.register(DEFAULT, onPress)
  active = DEFAULT
  return key === 'Command+Space'
    ? '⌘Space is still taken by Spotlight. Turn off "Show Spotlight search" in Keyboard Shortcuts, then try again.'
    : `Couldn't register ${key}.`
}
