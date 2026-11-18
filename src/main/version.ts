import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const file = () => path.join(app.getPath('userData'), 'last-seen-version')
// Written on first run by every earlier version, so its presence means this isn't a fresh install.
const earlierInstall = () => fs.existsSync(path.join(app.getPath('userData'), 'login-item-initialized'))

let unseen = false
let fresh = false

// Call before anything writes first-run markers. Fresh installs skip the notes; updates show them once.
export const checkVersion = () => {
  let last: string | null = null
  try {
    last = fs.readFileSync(file(), 'utf8').trim()
  } catch {
    // Never recorded.
  }
  unseen = last ? last !== app.getVersion() : earlierInstall()
  fresh = !last && !earlierInstall()
  if (!unseen) markNotesSeen()
  return unseen
}

export const notesUnseen = () => unseen

export const isFreshInstall = () => fresh

export const markNotesSeen = () => {
  unseen = false
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), app.getVersion())
}
