import { useEffect, useState } from 'react'
import type { SearchFolder } from '../../shared/api'

const DEPTHS = Array.from({ length: 11 }, (_, i) => i)

const SearchSection = () => {
  const [folders, setFolders] = useState<SearchFolder[]>([])

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setFolders(s.searchFolders)
    })
  }, [])

  const saveFolders = async (next: SearchFolder[]) =>
    setFolders((await window.api.setSearchFolders(next)).searchFolders)

  const addFolder = async () => {
    const picked = await window.api.pickFolder()
    if (picked && !folders.some((f) => f.path === picked)) saveFolders([...folders, { path: picked, depth: null }])
  }

  return (
    <div className="section">
      <h2 className="section-title">Search</h2>
      <div className="hotkey-group">
        <div className="sidebar-header flat">
          <span>Folder search</span>
          <button type="button" className="btn small" onClick={addFolder}>
            + Add
          </button>
        </div>
        {folders.map((f, i) => (
          <div key={f.path} className="hotkey-row">
            <span className="mono">{f.path}</span>
            <span className="actions">
              <span className="muted">Depth</span>
              <select
                className="field select"
                value={f.depth ?? 'inf'}
                onChange={(e) =>
                  saveFolders(
                    folders.map((g, j) =>
                      j === i ? { ...g, depth: e.target.value === 'inf' ? null : Number(e.target.value) } : g,
                    ),
                  )
                }
              >
                <option value="inf">∞</option>
                {DEPTHS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn"
                title="Remove"
                onClick={() => saveFolders(folders.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </span>
          </div>
        ))}
        {folders.length === 0 && <div className="muted">No folders searched.</div>}
      </div>
    </div>
  )
}

export default SearchSection
