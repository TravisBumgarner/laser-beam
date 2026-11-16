import { useCallback, useEffect, useRef, useState } from 'react'
import { LAYOUT_POSITIONS, type Layout, type Preset, type PresetDraft, type PresetStep } from '../../shared/api'
import AppPicker from './AppPicker'

const NEW_STEP: PresetStep = { app: '', position: 'full', newWindow: true }
const LAYOUTS = Object.keys(LAYOUT_POSITIONS) as Layout[]

// One app per cell of the layout.
const fitSteps = (steps: PresetStep[], layout: Layout) =>
  LAYOUT_POSITIONS[layout].map((position, i) => ({ ...(steps[i] ?? NEW_STEP), position }))

// Presets saved before layouts existed: infer from their positions.
const EMPTY: PresetDraft = { id: null, name: '', layout: '1x2', steps: fitSteps([], '1x2') }

const withLayout = (p: Preset): Preset => {
  const layout =
    (p.layout in LAYOUT_POSITIONS ? p.layout : undefined) ??
    LAYOUTS.find((l) => p.steps.every((s) => LAYOUT_POSITIONS[l].includes(s.position))) ??
    '1x2'
  return { ...p, layout, steps: fitSteps(p.steps, layout) }
}

const PresetsSection = () => {
  const [presets, setPresets] = useState<Preset[]>([])
  const [draft, setDraft] = useState<PresetDraft>(EMPTY)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.listPresets().then((list) => {
      const fixed = list.map(withLayout)
      setPresets(fixed)
      if (fixed[0]) setDraft(fixed[0])
    })
  }, [])

  const saved = presets.find((p) => p.id === draft.id)
  const dirty = saved
    ? JSON.stringify([saved.name, saved.layout, saved.steps]) !==
      JSON.stringify([draft.name, draft.layout, draft.steps])
    : !!(draft.name || draft.steps.some((s) => s.app))

  const confirmDiscard = () => !dirty || window.confirm('Discard unsaved changes?')

  const select = (p: Preset) => {
    if (p.id === draft.id || !confirmDiscard()) return
    setDraft(p)
    setError(null)
  }

  const newPreset = () => {
    if (!confirmDiscard()) return
    setDraft(EMPTY)
    setError(null)
    requestAnimationFrame(() => nameRef.current?.focus())
  }

  const setStep = (i: number, patch: Partial<PresetStep>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))

  const save = useCallback(async () => {
    setError(null)
    try {
      const { id, presets: list } = await window.api.savePreset(draft)
      setPresets(list.map(withLayout))
      setDraft((d) => ({ ...d, id, name: d.name.trim() }))
    } catch (e) {
      setError(String(e).replace(/^.*Error: /, ''))
    }
  }, [draft])

  const remove = async () => {
    if (!saved || !window.confirm(`Delete "${saved.name}"?`)) return
    const list = await window.api.deletePreset(saved.id)
    const fixed = list.map(withLayout)
    setPresets(fixed)
    setDraft(fixed[0] ?? EMPTY)
  }

  const test = async () => {
    if (!saved || running) return
    setRunning(true)
    setError(null)
    try {
      setError(await window.api.runPreset(saved.id))
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey) return
      if (e.key === 's') {
        e.preventDefault()
        save()
      } else if (e.key === 'n') {
        e.preventDefault()
        newPreset()
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
          <button type="button" className="btn small" onClick={newPreset} title="New preset (⌘N)">
            + New
          </button>
        </div>
        <ul className="script-list">
          {presets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={p.id === draft.id ? 'script-item active' : 'script-item'}
                onClick={() => select(p)}
              >
                <span className="script-name">{p.name}</span>
                <span className="script-cmd">{p.steps.map((s) => s.app).join(' · ')}</span>
              </button>
            </li>
          ))}
          {presets.length === 0 && <li className="muted empty">No saved presets yet.</li>}
        </ul>
      </aside>

      <main className="editor">
        <label className="label">
          Name
          <input
            ref={nameRef}
            className="field"
            placeholder="e.g. Code + browser"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>

        <div className="label">
          Layout
          <div className="layout-options">
            {LAYOUTS.map((l) => {
              const [rows, cols] = l.split('x').map(Number)
              return (
                <button
                  key={l}
                  type="button"
                  title={l}
                  className={l === draft.layout ? 'layout-option active' : 'layout-option'}
                  style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                  onClick={() => {
                    setDraft((d) => ({
                      ...d,
                      layout: l,
                      steps: fitSteps(d.steps, l),
                    }))
                  }}
                >
                  {LAYOUT_POSITIONS[l].map((p) => (
                    <span key={p} className="layout-cell" />
                  ))}
                </button>
              )
            })}
          </div>
        </div>

        <div className="label">
          Apps <span className="muted">(opened in order)</span>
          {draft.steps.map((step, i) => (
            <div key={i} className="step-row">
              <span className="step-index">{i + 1}</span>
              <AppPicker value={step.app} onChange={(app) => setStep(i, { app })} />
              <div
                className="cell-picker"
                title={step.position}
                style={{
                  gridTemplateRows: `repeat(${draft.layout[0]}, 1fr)`,
                  gridTemplateColumns: `repeat(${draft.layout[2]}, 1fr)`,
                }}
              >
                {LAYOUT_POSITIONS[draft.layout].map((p) => (
                  <span key={p} className={p === step.position ? 'cell active' : 'cell'} />
                ))}
              </div>
              <button
                type="button"
                className={step.newWindow ? 'chip active' : 'chip'}
                onClick={() => setStep(i, { newWindow: !step.newWindow })}
              >
                New window
              </button>
            </div>
          ))}
        </div>

        <div className="actions">
          <button type="button" className="btn primary" onClick={save} disabled={!dirty}>
            {saved ? 'Save' : 'Create'} <kbd>⌘S</kbd>
          </button>
          <button type="button" className="btn" onClick={test} disabled={running || !saved || dirty}>
            {running ? 'Running…' : 'Test'}
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
      </main>
    </div>
  )
}

export default PresetsSection
