import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppResult, ClipEntry, Preset, SavedChat, SavedScript, ScriptResult } from '../shared/api'
import AiPanel from './panels/AiPanel'
import Tips from './Tips'

type View = 'search' | 'ai'

type Row = { key: string; label: string; detail?: string; icon?: string; run: () => void; remove?: () => void }

const COMMANDS = [
  { label: 'Todo Today', prefix: 'td_' },
  { label: 'Ask Claude', prefix: 'ai_' },
  { label: 'Scripts', prefix: 'sc_' },
  { label: 'Clipboard History', prefix: 'cb_' },
  { label: 'Search Google', prefix: 'se_' },
  { label: 'Laser Beam Config', prefix: 'co_' },
]

const parse = (query: string) => {
  const match = query.match(/^(ai|cb|co|pr|sc|se|td)_(.*)$/s)
  return match
    ? { mode: match[1] as 'ai' | 'cb' | 'co' | 'pr' | 'sc' | 'se' | 'td', rest: match[2] }
    : { mode: 'apps' as const, rest: query }
}

const MODES = [
  { prefix: 'ai_', label: 'Ask Claude' },
  { prefix: 'td_', label: 'Todo Today' },
  { prefix: 'sc_', label: 'Scripts' },
  { prefix: 'pr_', label: 'Presets' },
  { prefix: 'cb_', label: 'Clipboard History' },
  { prefix: 'se_', label: 'Search Google' },
  { prefix: 'co_', label: 'Config' },
]

const App = () => {
  const [view, setView] = useState<View>('search')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [apps, setApps] = useState<AppResult[]>([])
  const [scripts, setScripts] = useState<SavedScript[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiChat, setAiChat] = useState<SavedChat | null>(null)
  const [chats, setChats] = useState<SavedChat[]>([])
  const [clips, setClips] = useState<ClipEntry[]>([])
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [showModes, setShowModes] = useState(false)
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { mode, rest } = parse(query)

  const reset = useCallback(() => {
    setView('search')
    setQuery('')
    setSelected(0)
    setScriptResult(null)
    setNotice(null)
    setShowModes(false)
    window.api.listScripts().then(setScripts)
    window.api.listPresets().then(setPresets)
    window.api.listChats().then(setChats)
    window.api.listClips().then(setClips)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  useEffect(() => {
    reset()
    return window.api.onReset(reset)
  }, [reset])

  useEffect(() => {
    let cancelled = false
    window.api.searchApps(mode === 'apps' ? rest : '').then((r) => {
      if (!cancelled) setApps(r)
    })
    setSelected(0)
    return () => {
      cancelled = true
    }
  }, [mode, rest])

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new ResizeObserver(() => window.api.resize(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const back = () => {
    setView('search')
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  useEffect(() => {
    if (view === 'search') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.api.hide()
      else if (e.key === '[' && e.metaKey) {
        e.preventDefault()
        back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const runScript = async (command: string) => {
    setRunning(true)
    setScriptResult(null)
    try {
      setScriptResult(await window.api.runScript(command))
    } catch (error) {
      setScriptResult({ stdout: '', stderr: String(error), code: 1 })
    } finally {
      setRunning(false)
    }
  }

  const q = rest.trim().toLowerCase()
  const rows: Row[] =
    query === '' && showModes
      ? MODES.map((m) => ({
          key: m.prefix,
          label: m.label,
          detail: m.prefix,
          run: () => {
            setShowModes(false)
            if (m.prefix === 'co_') window.api.openSettings()
            else {
              setQuery(['td_', 'ai_', 'se_'].includes(m.prefix) ? `${m.prefix} ` : m.prefix)
              inputRef.current?.focus()
            }
          },
        }))
      : mode === 'ai'
        ? [
            {
              key: 'ai',
              label: q ? `Ask Claude: ${rest.trim()}` : 'Chat with Claude',
              run: () => {
                setAiPrompt(rest)
                setAiChat(null)
                setView('ai')
              },
            },
            ...chats
              .filter((c) => c.title.toLowerCase().includes(q))
              .map((c) => ({
                key: c.id,
                label: c.title,
                detail: 'prior',
                run: () => {
                  setAiPrompt('')
                  setAiChat(c)
                  setView('ai')
                },
                remove: () => window.api.deleteChat(c.id).then(setChats),
              })),
          ]
        : mode === 'td'
          ? q
            ? [
                {
                  key: 'td',
                  label: `Add to Todo Today: ${rest.trim()}`,
                  run: () => window.api.addTodo(rest).then(setNotice),
                },
              ]
            : []
          : mode === 'se'
            ? q
              ? [{ key: 'se', label: `Search Google: ${rest.trim()}`, run: () => window.api.searchWeb(rest) }]
              : []
            : mode === 'co'
              ? [{ key: 'co', label: 'Config', run: () => window.api.openSettings() }]
              : mode === 'cb'
                ? clips
                    .filter((c) => c.text.toLowerCase().includes(q))
                    .slice(0, 50)
                    .map((c) => ({
                      key: `${c.copiedAt}-${c.text}`,
                      label: c.text.replace(/\s+/g, ' ').trim().slice(0, 80),
                      detail: new Date(c.copiedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                      run: () => window.api.pasteClip(c.text),
                      remove: () => window.api.deleteClip(c.text).then(setClips),
                    }))
                : mode === 'pr'
                  ? presets
                      .filter((p) => p.name.toLowerCase().includes(q))
                      .map((p) => ({
                        key: p.id,
                        label: p.name,
                        detail: p.steps.map((st) => `${st.app} ${st.position}`).join(' · '),
                        run: () => window.api.runPreset(p.id).then(setNotice),
                      }))
                  : mode === 'sc'
                    ? scripts
                        .filter((s) => s.name.toLowerCase().includes(q))
                        .map((s) => ({
                          key: s.id,
                          label: s.name,
                          detail: s.command.split('\n')[0],
                          run: () => runScript(s.command),
                        }))
                    : [
                        // Commands that switch the bar into a prefix mode, e.g. picking "Todo Today" starts td_.
                        ...(q
                          ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q)).map((c) => ({
                              key: c.prefix,
                              label: c.label,
                              icon: apps.find((a) => a.name === c.label)?.icon,
                              detail: c.prefix,
                              run: () => setQuery(['td_', 'ai_', 'se_'].includes(c.prefix) ? `${c.prefix} ` : c.prefix),
                            }))
                          : []),
                        ...apps
                          .filter((a) => !COMMANDS.some((c) => c.label === a.name))
                          .map((a) => ({
                            key: a.path,
                            label: a.name,
                            icon: a.icon,
                            detail: a.kind === 'setting' ? 'System Settings' : undefined,
                            run: () => window.api.openApp(a.path),
                          })),
                      ]

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') window.api.hide()
    else if (e.key === 'ArrowDown' && query === '' && !showModes) {
      e.preventDefault()
      setShowModes(true)
      setSelected(0)
    } else if (e.key === 'ArrowUp' && showModes && query === '' && selected === 0) {
      e.preventDefault()
      setShowModes(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Backspace' && e.metaKey && rows[selected]?.remove) {
      e.preventDefault()
      rows[selected].remove?.()
      setSelected((s) => Math.max(0, Math.min(s, rows.length - 2)))
    } else if (e.key === 'Enter' && rows[selected]) {
      e.preventDefault()
      rows[selected].run()
    }
  }

  return (
    <div ref={rootRef} className="root">
      {view === 'search' && (
        <>
          <div className="search-row">
            <input
              ref={inputRef}
              className="search"
              value={query}
              placeholder="Laser Beam"
              onChange={(e) => {
                setQuery(e.target.value)
                setScriptResult(null)
                setNotice(null)
                setShowModes(false)
              }}
              onKeyDown={onSearchKeyDown}
            />
            {query === '' && !showModes && <span className="down-hint">↓</span>}
          </div>
          {rows.length > 0 && (
            <>
              <ul className="menu">
                {rows.map((r, i) => (
                  <li
                    key={r.key}
                    className={i === selected ? 'menu-item selected' : 'menu-item'}
                    onMouseEnter={() => setSelected(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      r.run()
                    }}
                  >
                    <span className="app-row">
                      {r.icon && <img className="app-icon" src={r.icon} alt="" />}
                      {r.label}
                    </span>
                    {i === selected && !showModes ? <kbd>↵</kbd> : r.detail && <kbd className="mono">{r.detail}</kbd>}
                  </li>
                ))}
              </ul>
              {notice && <div className="panel-body error">{notice}</div>}
              {(running || scriptResult) && (
                <div className="panel-body">
                  {running && <div className="muted">Running…</div>}
                  {scriptResult && (
                    <pre className={scriptResult.code === 0 ? 'output' : 'output error'}>
                      {scriptResult.stdout}
                      {scriptResult.stderr}
                      {!scriptResult.stdout && !scriptResult.stderr && `exit ${scriptResult.code}`}
                    </pre>
                  )}
                </div>
              )}
              <Tips tips={['↑↓ select', '↵ open', ...(rows[selected]?.remove ? ['⌘⌫ delete'] : []), 'esc close']} />
            </>
          )}
          {mode === 'pr' && presets.length === 0 && (
            <div className="panel-body muted">No saved presets. Add some in co_ → Presets.</div>
          )}
          {mode === 'cb' && clips.length === 0 && (
            <div className="panel-body muted">Nothing copied yet. Copy some text and it will show up here.</div>
          )}
          {mode === 'td' && !q && <div className="panel-body muted">Type a task, then ↵ to add it to today.</div>}
          {mode === 'sc' && scripts.length === 0 && (
            <div className="panel-body muted">No saved scripts. Add some in co_ → Scripts.</div>
          )}
        </>
      )}
      {view === 'ai' && <AiPanel initialPrompt={aiPrompt} initialChat={aiChat} />}
    </div>
  )
}

export default App
