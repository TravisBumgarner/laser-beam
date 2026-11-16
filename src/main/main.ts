import { execFile } from 'node:child_process'
import path from 'node:path'
import tty from 'node:tty'
import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } from 'electron'
import { UpdateSourceType, updateElectronApp } from 'update-electron-app'
import { LAYOUT_POSITIONS, type Layout, type Settings } from '../shared/api'
import { chat, deleteChat, listChats, recordChat } from './ai'
import { openApp, searchApps, watchApps } from './apps'
import { exportAll, importAll } from './backup'
import { deleteClip, listClips, pasteClip, watchClipboard } from './clipboard'
import { initLaunchAtLogin, setLaunchAtLogin } from './loginItem'
import { deletePreset, listPresets, runPreset, savePreset } from './presets'
import { deleteScript, listScripts, runScript, saveScript } from './scripts'

// update.electronjs.org only answers the all-lowercase owner/repo path.
updateElectronApp({
  updateSource: { type: UpdateSourceType.ElectronPublicUpdateService, repo: 'travisbumgarner/laser-beam' },
})

// Logging to a closed terminal (dev process killed) throws EPIPE; ignore it.
for (const stream of [process.stdout, process.stderr]) stream.on('error', () => {})

const HOTKEY = 'Alt+Space'
const WIDTH = 680
const MAX_HEIGHT = 520

let win: BrowserWindow | null = null
let anchor = { x: 0, y: 0 }
let dialogOpen = false

const createWindow = () => {
  win = new BrowserWindow({
    width: WIDTH,
    height: 60,
    type: 'panel',
    acceptFirstMouse: true,
    frame: false,
    resizable: false,
    show: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.on('blur', () => {
    if (!win || dialogOpen) return
    // Clicking inside the panel can briefly blur it on macOS; only hide when the click was elsewhere.
    const { x, y } = screen.getCursorScreenPoint()
    const b = win.getBounds()
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      win.focus()
      return
    }
    win.hide()
  })

  loadRenderer(win)
}

const loadRenderer = (w: BrowserWindow, hash = '') => {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    w.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${hash ? `#${hash}` : ''}`)
  } else {
    w.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), { hash })
  }
}

let settingsWin: BrowserWindow | null = null

const openSettings = () => {
  win?.hide()
  if (settingsWin) {
    settingsWin.show()
    settingsWin.focus()
    return
  }
  settingsWin = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 640,
    minHeight: 400,
    title: 'Laser Beam Settings',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  settingsWin.on('closed', () => {
    settingsWin = null
  })
  loadRenderer(settingsWin, 'settings')
  app.focus({ steal: true })
}

const toggle = () => {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    win.webContents.send('window:reset')
    anchor = {
      x: Math.round(workArea.x + (workArea.width - WIDTH) / 2),
      y: Math.round(workArea.y + workArea.height * 0.3),
    }
    win.setBounds({ ...anchor, width: WIDTH, height: 60 })
    win.show()
    win.setBounds({ ...anchor, width: WIDTH, height: 60 })
    win.focus()
  }
}

const settings = (): Settings => ({ hotkey: HOTKEY, launchAtLogin: app.getLoginItemSettings().openAtLogin })

const registerIpc = () => {
  ipcMain.on('window:hide', () => win?.hide())
  ipcMain.on('window:resize', (_e, height: unknown) => {
    if (!win?.isVisible() || typeof height !== 'number' || !Number.isFinite(height)) return
    win?.setBounds({ ...anchor, width: WIDTH, height: Math.min(MAX_HEIGHT, Math.max(60, Math.ceil(height))) })
  })
  ipcMain.handle('settings:get', () => settings())
  ipcMain.handle('settings:launchAtLogin', (_e, enabled: unknown) => {
    if (typeof enabled !== 'boolean') throw new Error('Invalid value')
    setLaunchAtLogin(enabled)
    return settings()
  })
  ipcMain.handle('apps:search', (_e, query: unknown) => (typeof query === 'string' ? searchApps(query) : []))
  ipcMain.handle('apps:open', async (_e, appPath: unknown) => {
    if (typeof appPath !== 'string') throw new Error('Invalid path')
    // Open first, then hide: hiding first hands focus back to the previous app, which can
    // immediately steal it from apps that close on blur (like todo-today's menu bar popover).
    await openApp(appPath)
    win?.hide()
  })
  ipcMain.handle('web:search', async (_e, query: unknown) => {
    if (typeof query !== 'string' || !query.trim()) return
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`
    await new Promise((resolve) => execFile('open', ['-a', 'Firefox', url], resolve))
    win?.hide()
  })
  ipcMain.handle('script:run', (_e, command: unknown) => {
    if (typeof command !== 'string' || !command.trim()) throw new Error('Invalid command')
    return runScript(command)
  })
  ipcMain.handle('scripts:list', () => listScripts())
  ipcMain.handle('scripts:save', (_e, draft: unknown) => {
    const { id, name, command } = (draft ?? {}) as Record<string, unknown>
    if (typeof name !== 'string' || !name.trim() || typeof command !== 'string' || !command.trim()) {
      throw new Error('Name and command are required')
    }
    if (id !== null && typeof id !== 'string') throw new Error('Invalid id')
    return saveScript({ id, name: name.trim(), command })
  })
  ipcMain.handle('presets:list', () => listPresets())
  ipcMain.handle('presets:save', (_e, draft: unknown) => {
    const { id, name, layout, steps } = (draft ?? {}) as Record<string, unknown>
    if (typeof layout !== 'string' || !(layout in LAYOUT_POSITIONS)) throw new Error('Invalid layout')
    const positions: string[] = LAYOUT_POSITIONS[layout as Layout]
    const valid =
      Array.isArray(steps) &&
      steps.length === positions.length &&
      steps.every(
        (s) =>
          s &&
          typeof s.app === 'string' &&
          s.app.trim() &&
          positions.includes(s.position) &&
          typeof s.newWindow === 'boolean',
      )
    if (typeof name !== 'string' || !name.trim() || !valid)
      throw new Error('Name and an app for every cell are required')
    if (id !== null && typeof id !== 'string') throw new Error('Invalid id')
    return savePreset({ id, name: name.trim(), layout: layout as Layout, steps })
  })
  ipcMain.handle('presets:delete', (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return deletePreset(id)
  })
  ipcMain.handle('presets:run', async (_e, id: unknown) => {
    const preset = listPresets().find((p) => p.id === id)
    if (!preset) return 'Preset not found'
    win?.hide()
    const error = await runPreset(preset)
    if (error) win?.show()
    return error
  })
  ipcMain.on('settings:open', () => openSettings())
  ipcMain.handle('todo:add', async (_e, title: unknown) => {
    if (typeof title !== 'string') throw new Error('Invalid title')
    const trimmed = title.trim()
    try {
      if (trimmed) {
        await shell.openExternal(`todo-today://add?title=${encodeURIComponent(trimmed)}`, { activate: false })
      } else {
        // An empty title opens todo-today itself (re-opening the bundle also shows its menu bar popover).
        const { path: appPath } = await app.getApplicationInfoForProtocol('todo-today://')
        const error = await shell.openPath(appPath)
        if (error) throw new Error(error)
      }
    } catch {
      return 'Todo Today 4.5.0 or newer is needed for td_. Update it, or run it once so macOS registers it.'
    }
    win?.hide()
    return null
  })
  ipcMain.handle('scripts:delete', (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return deleteScript(id)
  })
  const withDialog = async <T>(target: BrowserWindow | null, fn: (w: BrowserWindow) => Promise<T>) => {
    if (!target) return null
    dialogOpen = true
    try {
      return await fn(target)
    } finally {
      dialogOpen = false
      target.focus()
    }
  }
  ipcMain.handle('backup:export', (e) => withDialog(BrowserWindow.fromWebContents(e.sender), exportAll))
  ipcMain.handle('backup:import', (e) => withDialog(BrowserWindow.fromWebContents(e.sender), importAll))
  ipcMain.handle('ai:chat', async (_e, prompt: unknown, sessionId: unknown) => {
    if (typeof prompt !== 'string' || !prompt.trim()) return { ok: false, error: 'Empty prompt' }
    if (sessionId !== null && (typeof sessionId !== 'string' || !/^[\w-]+$/.test(sessionId))) {
      return { ok: false, error: 'Invalid session' }
    }
    const result = await chat(prompt, sessionId)
    if (result.ok) recordChat(sessionId, result.sessionId, prompt, result.text)
    return result
  })
  ipcMain.handle('ai:list', () => listChats())
  ipcMain.handle('clipboard:list', () => listClips())
  ipcMain.handle('clipboard:delete', (_e, text: unknown) => {
    if (typeof text !== 'string') throw new Error('Invalid text')
    return deleteClip(text)
  })
  ipcMain.handle('ai:delete', (_e, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid id')
    return deleteChat(id)
  })
  ipcMain.handle('clipboard:paste', async (_e, text: unknown) => {
    if (typeof text !== 'string') throw new Error('Invalid text')
    // Hide first so the previous app is frontmost when the paste keystroke lands.
    win?.hide()
    await pasteClip(text)
  })
}

// Ctrl+C / kill should always stop the app, and in dev so should forge going away.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(signal, () => app.exit(0))
if (!app.isPackaged) {
  const startedInTerminal = tty.isatty(1)
  setInterval(() => {
    if (process.ppid === 1 || (startedInTerminal && !tty.isatty(1))) app.exit(0)
  }, 1000).unref()
}

app.whenReady().then(() => {
  app.dock?.hide()
  initLaunchAtLogin()
  registerIpc()
  watchApps()
  watchClipboard()
  createWindow()
  if (!globalShortcut.register(HOTKEY, toggle)) {
    console.error(`Failed to register ${HOTKEY}`)
  }
})

// Windows only ever show the bundled renderer: block navigation and new windows.
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (event) => event.preventDefault())
  contents.on('will-redirect', (event) => event.preventDefault())
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => {})
