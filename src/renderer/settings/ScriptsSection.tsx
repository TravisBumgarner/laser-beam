import { useCallback, useEffect, useRef, useState } from 'react'
import type { SavedScript, ScriptDraft, ScriptResult } from '../../shared/api'

const EMPTY: ScriptDraft = { id: null, name: '', command: '' }

type Run = { result: ScriptResult; ms: number }

const ScriptsSection = () => {
  const [scripts, setScripts] = useState<SavedScript[]>([])
  const [draft, setDraft] = useState<ScriptDraft>(EMPTY)
  const [running, setRunning] = useState(false)
  const [run, setRun] = useState<Run | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.listScripts().then((list) => {
      setScripts(list)
      if (list[0]) setDraft(list[0])
    })
  }, [])

  const saved = scripts.find((s) => s.id === draft.id)
  const dirty = saved ? saved.name !== draft.name || saved.command !== draft.command : !!(draft.name || draft.command)

  const confirmDiscard = () => !dirty || window.confirm('Discard unsaved changes?')

  const select = (s: SavedScript) => {
    if (s.id === draft.id || !confirmDiscard()) return
    setDraft(s)
    setRun(null)
    setError(null)
  }

  const newScript = () => {
    if (!confirmDiscard()) return
    setDraft(EMPTY)
    setRun(null)
    setError(null)
    requestAnimationFrame(() => nameRef.current?.focus())
  }

  const save = useCallback(async () => {
    setError(null)
    try {
      const { id, scripts: list } = await window.api.saveScript(draft)
      setScripts(list)
      setDraft((d) => ({ ...d, id, name: d.name.trim() }))
    } catch (e) {
      setError(String(e).replace(/^.*Error: /, ''))
    }
  }, [draft])

  const remove = async () => {
    if (!saved || !window.confirm(`Delete "${saved.name}"?`)) return
    const list = await window.api.deleteScript(saved.id)
    setScripts(list)
    setDraft(list[0] ?? EMPTY)
    setRun(null)
  }

  const test = useCallback(async () => {
    if (!draft.command.trim() || running) return
    setRunning(true)
    setRun(null)
    const start = performance.now()
    try {
      const result = await window.api.runScript(draft.command)
      setRun({ result, ms: Math.round(performance.now() - start) })
    } catch (e) {
      setRun({ result: { stdout: '', stderr: String(e), code: 1 }, ms: 0 })
    } finally {
      setRunning(false)
    }
  }, [draft.command, running])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey) return
      if (e.key === 's') {
        e.preventDefault()
        save()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        test()
      } else if (e.key === 'n') {
        e.preventDefault()
        newScript()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="scripts-section">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>Saved</span>
          <button type="button" className="btn small" onClick={newScript} title="New script (⌘N)">
            + New
          </button>
        </div>
        <ul className="script-list">
          {scripts.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={s.id === draft.id ? 'script-item active' : 'script-item'}
                onClick={() => select(s)}
              >
                <span className="script-name">{s.name}</span>
                <span className="script-cmd">{s.command.split('\n')[0]}</span>
              </button>
            </li>
          ))}
          {scripts.length === 0 && <li className="muted empty">No saved scripts yet.</li>}
        </ul>
      </aside>

      <main className="editor">
        <label className="label">
          Name
          <input
            ref={nameRef}
            className="field"
            placeholder="e.g. Pull all repos"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="label grow">
          Command <span className="muted">(runs in zsh from ~)</span>
          <textarea
            className="field mono code"
            placeholder="cd ~/Programming && git -C todo-today pull"
            spellCheck={false}
            value={draft.command}
            onChange={(e) => setDraft({ ...draft, command: e.target.value })}
          />
        </label>

        <div className="actions">
          <button type="button" className="btn primary" onClick={save} disabled={!dirty}>
            {saved ? 'Save' : 'Create'} <kbd>⌘S</kbd>
          </button>
          <button type="button" className="btn" onClick={test} disabled={running || !draft.command.trim()}>
            {running ? 'Running…' : 'Test'} <kbd>⌘↵</kbd>
          </button>
          <span className="spacer" />
          {dirty && <span className="muted">Unsaved changes</span>}
          {saved && (
            <button type="button" className="btn danger" onClick={remove}>
              Delete
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {run && (
          <div className="run">
            <div className="run-meta">
              <span className={run.result.code === 0 ? 'ok' : 'error'}>exit {run.result.code}</span>
              <span className="muted">{run.ms} ms</span>
            </div>
            <pre className="output tall">
              {run.result.stdout}
              {run.result.stderr && <span className="error">{run.result.stderr}</span>}
              {!run.result.stdout && !run.result.stderr && <span className="muted">(no output)</span>}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}

export default ScriptsSection
