import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

// Appends to ~/Library/Logs/Laser Beam/main.log, rolling over to main.old.log past 5MB.
const MAX_BYTES = 5 * 1024 * 1024

const file = () => path.join(app.getPath('logs'), 'main.log')

export const log = (event: string, data?: Record<string, unknown>) => {
  const line = `${new Date().toISOString()} ${event}${data ? ` ${JSON.stringify(data)}` : ''}\n`
  try {
    const f = file()
    fs.mkdirSync(path.dirname(f), { recursive: true })
    if (fs.existsSync(f) && fs.statSync(f).size > MAX_BYTES) fs.renameSync(f, f.replace(/\.log$/, '.old.log'))
    fs.appendFileSync(f, line)
  } catch {
    // Logging must never break the app.
  }
}
