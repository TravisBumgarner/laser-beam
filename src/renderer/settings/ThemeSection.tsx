import { type CSSProperties, useEffect, useState } from 'react'
import { DEFAULT_THEME, THEMES, themeStyle } from '../themes'

const ThemeSection = () => {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    window.api.getSettings().then((s) => setActive(s.theme))
    return window.api.onThemeChange(setActive)
  }, [])

  const previewId = active ?? DEFAULT_THEME

  return (
    <div className="section">
      <h2 className="section-title">Theme</h2>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === active ? 'theme-card active' : 'theme-card'}
            onClick={() => {
              setActive(t.id)
              window.api.setTheme(t.id)
            }}
          >
            <span className="theme-swatches">
              {t.swatches.map((c) => (
                <span key={c} className="theme-swatch" style={{ background: c }} />
              ))}
            </span>
            <span>{t.name}</span>
            {t.id === active && <span className="theme-check">✓</span>}
          </button>
        ))}
      </div>
      <div className="theme-preview-wrap">
        <div className="root theme-preview" style={themeStyle(previewId) as CSSProperties}>
          <div className="search-row">
            <input className="search" readOnly value="Spo" />
          </div>
          <ul className="menu">
            <li className="menu-item selected">
              <span className="app-row">Spotify</span>
              <kbd className="mono row-detail" />
              <kbd className="row-enter">↵</kbd>
            </li>
            <li className="menu-item">
              <span className="app-row">Sports</span>
              <kbd className="mono row-detail">~/Documents</kbd>
              <kbd className="row-enter" />
            </li>
          </ul>
          <div className="tips">
            <span>↑↓ select</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSection
