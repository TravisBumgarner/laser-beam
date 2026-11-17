import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const file = () => path.join(app.getPath('userData'), 'theme.json')

export const getTheme = (): string => {
  try {
    const { id } = JSON.parse(fs.readFileSync(file(), 'utf8'))
    if (typeof id === 'string') return id
  } catch {
    // Not chosen yet.
  }
  return 'laser-beam'
}

export const setTheme = (id: string) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify({ id }))
}
