import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fillParams,
  type SavedScript,
  type ScriptDraft,
  type ScriptParam,
  type ScriptResult,
  TERMINALS,
  type TerminalApp,
} from '../../shared/api'

const EMPTY: ScriptDraft = { id: null, name: '', command: '', runIn: 'internal', terminal: 'Terminal', params: [] }

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
  const dirty = saved
    ? saved.name !== draft.name ||
      saved.command !== draft.command ||
      saved.runIn !== draft.runIn ||
      saved.terminal !== draft.terminal ||
      JSON.stringify(saved.params) !== JSON.stringify(draft.params)
    : !!(draft.name || draft.command || draft.params.length)

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

  const setParam = (i: number, patch: Partial<ScriptParam>) =>
    setDraft({ ...draft, params: draft.params.map((p, j) => (j === i ? { ...p, ...patch } : p)) })

  // Testing uses each param's default value.
  const test = useCallback(async () => {
    if (!draft.command.trim() || running) return
    const command = fillParams(
      draft.command,
      draft.params,
      draft.params.map((p) => p.default),
    )
    if (draft.runIn === 'terminal') {
      const err = await window.api.runInTerminal(command, draft.terminal)
      setError(err)
      return
    }
    setRunning(true)
    setRun(null)
    const start = performance.now()
    try {
      const result = await window.api.runScript(command)
      setRun({ result, ms: Math.round(performance.now() - start) })
    } catch (e) {
      setRun({ result: { stdout: '', stderr: String(e), code: 1 }, ms: 0 })
    } finally {
      setRunning(false)
    }
  }, [draft.command, draft.params, draft.runIn, draft.terminal, running])

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

      <main className="editor script-editor">
        <div className="se-head">
          <label className="se-name">
            <span className="se-label">Name</span>
            <input
              ref={nameRef}
              placeholder="e.g. Pull all repos"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <select
            className="field select"
            value={draft.runIn === 'internal' ? 'internal' : draft.terminal}
            onChange={(e) =>
              setDraft(
                e.target.value === 'internal'
                  ? { ...draft, runIn: 'internal' }
                  : { ...draft, runIn: 'terminal', terminal: e.target.value as TerminalApp },
              )
            }
          >
            <option value="internal">Run in Laser Beam</option>
            {TERMINALS.map((t) => (
              <option key={t} value={t}>
                Run in {t}
              </option>
            ))}
          </select>
        </div>

        <div className="se-box">
          <div className="se-box-head">
            <span className="se-label">Command</span>
            <span className="muted mono">zsh · ~</span>
          </div>
          <textarea
            className="mono se-code"
            placeholder="cd ~/Programming && git -C todo-today pull"
            spellCheck={false}
            value={draft.command}
            onChange={(e) => setDraft({ ...draft, command: e.target.value })}
          />
        </div>

        <div className="se-params">
          <div className="se-params-head">
            <span className="se-label">Params</span>
            <span className="muted">
              use as <code className="mono">{'{{name}}'}</code>
            </span>
            <span className="spacer" />
            <button
              type="button"
              className="se-add"
              onClick={() => setDraft({ ...draft, params: [...draft.params, { name: '', default: '' }] })}
            >
              + Add
            </button>
          </div>
          {draft.params.map((p, i) => (
            <div className="se-param" key={i}>
              <input
                className="mono"
                placeholder="name"
                spellCheck={false}
                value={p.name}
                onChange={(e) => setParam(i, { name: e.target.value })}
              />
              <input
                placeholder="default value"
                value={p.default}
                onChange={(e) => setParam(i, { default: e.target.value })}
              />
              <button
                type="button"
                title="Remove param"
                onClick={() => setDraft({ ...draft, params: draft.params.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
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
        <span className="spacer" />

        <div className="actions">
          <button type="button" className="btn primary" onClick={save} disabled={!dirty}>
            {saved ? 'Save' : 'Create'} <kbd>⌘S</kbd>
          </button>
          <button type="button" className="btn" onClick={test} disabled={running || !draft.command.trim()}>
            {running ? 'Running…' : 'Test'} <kbd>⌘↵</kbd>
          </button>
          <span className="spacer" />
          {dirty && <span className="muted se-unsaved">Unsaved</span>}
          {saved && (
            <button type="button" className="btn danger se-delete" onClick={remove}>
              Delete
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

export default ScriptsSection
