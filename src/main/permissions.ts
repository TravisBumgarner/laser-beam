import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app, shell, systemPreferences } from 'electron'
import type { Permission, PermissionId, PermissionStatus } from '../shared/api'
import { buildFolderIndex } from './folders'

type Target = { id: PermissionId; label: string; why: string; bundleId?: string; appPath?: string }

const TARGETS: Target[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    why: 'Pastes clipboard history into the app you were using and moves windows for presets.',
  },
  {
    id: 'files',
    label: 'Files & Folders: Desktop, Documents, Downloads',
    why: 'Lets folder search find Desktop, Documents and Downloads and the folders inside them.',
  },
  {
    id: 'system-events',
    label: 'Automation: System Events',
    why: 'Sends the paste keystroke and arranges preset windows.',
    bundleId: 'com.apple.systemevents',
  },
  {
    id: 'terminal',
    label: 'Automation: Terminal',
    why: 'Types a script into Terminal. Only needed for scripts set to run in Terminal.',
    bundleId: 'com.apple.Terminal',
    appPath: '/System/Applications/Utilities/Terminal.app',
  },
  {
    id: 'iterm',
    label: 'Automation: iTerm',
    why: 'Types a script into iTerm. Only needed for scripts set to run in iTerm.',
    bundleId: 'com.googlecode.iterm2',
    appPath: '/Applications/iTerm.app',
  },
]

const ACCESSIBILITY_PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
const AUTOMATION_PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation'
const FILES_PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_FilesAndFolders'

const PROTECTED_FOLDERS = ['Desktop', 'Documents', 'Downloads'].map((name) => path.join(os.homedir(), name))

// Reading each folder makes macOS show its Allow prompt the first time; after that it just succeeds or fails.
const askFiles = async (): Promise<PermissionStatus> => {
  const results = await Promise.all(
    PROTECTED_FOLDERS.map((dir) =>
      fs.promises.readdir(dir).then(
        () => true,
        (error: NodeJS.ErrnoException) => error.code === 'ENOENT',
      ),
    ),
  )
  return results.every(Boolean) ? 'granted' : 'missing'
}

// Automation can't be checked without asking, so remember each answer once macOS has given it.
const file = () => path.join(app.getPath('userData'), 'permissions.json')

const readAnswers = (): Partial<Record<PermissionId, PermissionStatus>> => {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8'))
  } catch {
    return {}
  }
}

const saveAnswer = (id: PermissionId, status: PermissionStatus) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify({ ...readAnswers(), [id]: status }, null, 2))
}

// Sends one harmless Apple Event. The first time, macOS shows its Allow prompt and this waits for the answer.
const askAutomation = (bundleId: string) =>
  new Promise<PermissionStatus>((resolve) =>
    execFile(
      'osascript',
      ['-e', `tell application id "${bundleId}" to count windows`],
      { timeout: 120_000 },
      (error, _stdout, stderr) => {
        if (!error) return resolve('granted')
        resolve(/-1743|not allowed/i.test(stderr) ? 'missing' : 'unknown')
      },
    ),
  )

const installed = (t: Target) => !t.appPath || fs.existsSync(t.appPath)

const statusOf = async (t: Target): Promise<PermissionStatus> => {
  if (t.id === 'accessibility') return systemPreferences.isTrustedAccessibilityClient(false) ? 'granted' : 'missing'
  const answer = readAnswers()[t.id]
  // Once macOS has been asked, reading the folders again won't prompt, so recheck live.
  if (answer && t.id === 'files') return askFiles()
  // System Events runs in the background, so once macOS has an answer it can be rechecked without a prompt.
  if (answer && t.id === 'system-events' && t.bundleId) return askAutomation(t.bundleId)
  return answer ?? 'unknown'
}

export const listPermissions = async (): Promise<Permission[]> =>
  Promise.all(
    TARGETS.filter(installed).map(async (t) => ({ id: t.id, label: t.label, why: t.why, status: await statusOf(t) })),
  )

export const requestPermission = async (id: PermissionId) => {
  const target = TARGETS.find((t) => t.id === id)
  if (!target) throw new Error('Unknown permission')
  if (id === 'accessibility') {
    // Adds Laser Beam to the list (and prompts once); the switch itself has to be flipped in System Settings.
    if (!systemPreferences.isTrustedAccessibilityClient(true)) await shell.openExternal(ACCESSIBILITY_PANE)
  } else if (id === 'files') {
    const status = await askFiles()
    saveAnswer(id, status)
    if (status === 'granted') buildFolderIndex()
    // Once denied, macOS won't prompt again; it has to be switched on in System Settings.
    else await shell.openExternal(FILES_PANE)
  } else if (target.bundleId) {
    const status = await askAutomation(target.bundleId)
    if (status !== 'unknown') saveAnswer(id, status)
    // Once denied, macOS won't prompt again; it has to be switched on in System Settings.
    if (status === 'missing') await shell.openExternal(AUTOMATION_PANE)
  }
  return listPermissions()
}

// Fresh installs get the setup wizard until it's finished or skipped.
const pendingFile = () => path.join(app.getPath('userData'), 'setup-pending')

export const markSetupPending = () => {
  fs.mkdirSync(path.dirname(pendingFile()), { recursive: true })
  fs.writeFileSync(pendingFile(), '')
}

export const setupNeeded = () => fs.existsSync(pendingFile())

export const completeSetup = () => fs.rmSync(pendingFile(), { force: true })
