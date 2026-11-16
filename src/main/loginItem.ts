import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

// Marker so launch-at-login is turned on once (first run) and the user's choice wins after that.
const marker = () => path.join(app.getPath('userData'), 'login-item-initialized')

export const setLaunchAtLogin = (enabled: boolean) => {
  // Dev builds would register the bare Electron binary, so only packaged apps touch login items.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: enabled })
}

export const initLaunchAtLogin = () => {
  if (fs.existsSync(marker())) return
  setLaunchAtLogin(true)
  fs.mkdirSync(path.dirname(marker()), { recursive: true })
  fs.writeFileSync(marker(), '')
}
