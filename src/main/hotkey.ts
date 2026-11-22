import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { app, globalShortcut } from 'electron'
import { log } from './log'

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

// macOS lets both apps claim ⌘Space, so check Spotlight's own shortcut (symbolic hotkey 64): it owns ⌘Space
// when it's enabled and still bound to Space (key code 49) with Command (1048576). Missing means the default, ⌘Space.
const spotlightOwnsCmdSpace = () => {
  try {
    const json = execFileSync('/bin/sh', [
      '-c',
      'defaults export com.apple.symbolichotkeys - | plutil -extract AppleSymbolicHotKeys.64 json -o - -',
    ]).toString()
    const entry = JSON.parse(json) as { enabled?: boolean; value?: { parameters?: number[] } }
    const [, keyCode, modifiers] = entry.value?.parameters ?? []
    return entry.enabled !== false && keyCode === 49 && modifiers === 1048576
  } catch {
    return true
  }
}

export const currentHotkey = () => active

// ⌘Space only registers once Spotlight's shortcut is turned off; if it's taken, fall back to ⌥Space.
export const registerHotkey = (onPress: () => void, key: Hotkey = saved()): string | null => {
  globalShortcut.unregisterAll()
  const blocked = key === 'Command+Space' && spotlightOwnsCmdSpace()
  log('hotkey:register', { key, blocked })
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

// Not saved, so it never changes the installed app's choice.
export const registerDevHotkey = (onPress: () => void): string | null => {
  globalShortcut.unregisterAll()
  return globalShortcut.register('Control+Space', onPress)
    ? null
    : "Couldn't register ⌃Space. macOS uses it to switch input sources; turn that off in Keyboard Shortcuts."
}
