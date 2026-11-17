import { execFileSync } from 'node:child_process'
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

// macOS lets both apps claim ⌘Space, so check Spotlight's own shortcut (symbolic hotkey 64).
// A missing entry means it's still on at its default.
const spotlightOwnsCmdSpace = () => {
  try {
    const json = execFileSync('/bin/sh', [
      '-c',
      'defaults export com.apple.symbolichotkeys - | plutil -extract AppleSymbolicHotKeys.64.enabled json -o - -',
    ])
      .toString()
      .trim()
    return json !== 'false'
  } catch {
    return true
  }
}

export const currentHotkey = () => active

// ⌘Space only registers once Spotlight's shortcut is turned off; if it's taken, fall back to ⌥Space.
export const registerHotkey = (onPress: () => void, key: Hotkey = saved()): string | null => {
  globalShortcut.unregisterAll()
  const blocked = key === 'Command+Space' && spotlightOwnsCmdSpace()
  if (!blocked && globalShortcut.register(key, onPress)) {
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
