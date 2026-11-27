import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { ChatResult, SavedChat } from '../shared/api'

// Runs the logged-in Claude Code CLI so usage counts against the user's Claude plan.
export const chat = (prompt: string, sessionId: string | null) =>
  new Promise<ChatResult>((resolve) => {
    const args = ['claude', '-p', '--output-format', 'json']
    if (sessionId) args.push('--resume', sessionId)
    // A login shell skips ~/.zshrc, where the native installer puts ~/.local/bin on PATH, so add the usual spots.
    const extra = [path.join(os.homedir(), '.local/bin'), '/opt/homebrew/bin', '/usr/local/bin']
    const env = { ...process.env, PATH: [...extra, process.env.PATH].filter(Boolean).join(':') }
    const child = spawn('/bin/zsh', ['-lc', args.map((a) => `'${a}'`).join(' ')], { cwd: os.homedir(), env })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })
    child.on('error', (error) => resolve({ ok: false, error: error.message }))
    child.on('close', () => {
      try {
        const data = JSON.parse(stdout)
        if (data.is_error) resolve({ ok: false, error: String(data.result ?? 'Claude returned an error.') })
        else resolve({ ok: true, text: String(data.result ?? ''), sessionId: String(data.session_id) })
      } catch {
        resolve({ ok: false, error: stderr.trim() || stdout.trim() || 'Failed to run claude CLI.' })
      }
    })

    child.stdin.end(prompt)
  })

const historyFile = () => path.join(app.getPath('userData'), 'chats.json')

export const listChats = (): SavedChat[] => {
  try {
    return JSON.parse(fs.readFileSync(historyFile(), 'utf8'))
  } catch {
    return []
  }
}

export const deleteChat = (id: string) => {
  const chats = listChats().filter((c) => c.id !== id)
  fs.mkdirSync(path.dirname(historyFile()), { recursive: true })
  fs.writeFileSync(historyFile(), JSON.stringify(chats, null, 2))
  return chats
}

// Records a finished exchange, moving the chat to the top of the history.
export const recordChat = (prevId: string | null, nextId: string, prompt: string, reply: string) => {
  const chats = listChats()
  const existing = chats.find((c) => c.id === (prevId ?? nextId))
  const entry: SavedChat = {
    id: nextId,
    title: existing?.title ?? prompt.trim().split('\n')[0].slice(0, 80),
    messages: [
      ...(existing?.messages ?? []),
      { role: 'user', content: prompt.trim() },
      { role: 'assistant', content: reply },
    ],
  }
  const rest = chats.filter((c) => c !== existing && c.id !== nextId)
  fs.mkdirSync(path.dirname(historyFile()), { recursive: true })
  fs.writeFileSync(historyFile(), JSON.stringify([entry, ...rest].slice(0, 50), null, 2))
}
