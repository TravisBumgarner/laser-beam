import { useEffect, useState } from 'react'
import type { AppResult } from '../../shared/api'

type Props = { value: string; onChange: (name: string) => void }

const AppPicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<AppResult[]>([])
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    window.api.searchApps(value).then((r) => {
      if (!cancelled) setResults(r.filter((a) => a.kind === 'app'))
    })
    setSelected(0)
    return () => {
      cancelled = true
    }
  }, [value, open])

  const pick = (a: AppResult) => {
    onChange(a.name)
    setOpen(false)
  }

  return (
    <div className="app-picker">
      <input
        className="field"
        placeholder="Visual Studio Code"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelected((s) => Math.min(s + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelected((s) => Math.max(s - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            pick(results[selected])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && results.length > 0 && (
        <ul className="menu app-picker-menu">
          {results.map((a, i) => (
            <li
              key={a.path}
              className={i === selected ? 'menu-item selected' : 'menu-item'}
              onMouseEnter={() => setSelected(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(a)
              }}
            >
              <span className="app-row">
                {a.icon && <img className="app-icon" src={a.icon} alt="" />}
                {a.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AppPicker
