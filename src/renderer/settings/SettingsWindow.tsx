import { useEffect, useState } from 'react'
import { RELEASE_NOTES } from '../../shared/releaseNotes'
import BackupSection from './BackupSection'
import GeneralSection from './GeneralSection'
import HotkeysSection from './HotkeysSection'
import PresetsSection from './PresetsSection'
import ReleaseNotesSection from './ReleaseNotesSection'
import ScriptsSection from './ScriptsSection'
import SearchSection from './SearchSection'
import ThemeSection from './ThemeSection'

const SECTIONS = [
  { id: 'general', label: 'General', Component: GeneralSection },
  { id: 'theme', label: 'Theme', Component: ThemeSection },
  { id: 'search', label: 'Search', Component: SearchSection },
  { id: 'scripts', label: 'Scripts', Component: ScriptsSection },
  { id: 'presets', label: 'Presets', Component: PresetsSection },
  { id: 'backup', label: 'Backup', Component: BackupSection },
] as const

// Pinned to the bottom left of the sidebar.
const FOOTER_SECTIONS = [
  { id: 'hotkeys', label: 'Hotkeys', Component: HotkeysSection },
  { id: 'notes', label: 'Release notes', Component: ReleaseNotesSection },
] as const

type SectionId = (typeof SECTIONS)[number]['id'] | (typeof FOOTER_SECTIONS)[number]['id']

const SettingsWindow = () => {
  const [active, setActive] = useState<SectionId>('general')
  const [version, setVersion] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const { Component } = [...SECTIONS, ...FOOTER_SECTIONS].find((s) => s.id === active) ?? SECTIONS[0]

  useEffect(() => {
    window.api.getAppInfo().then((info) => {
      setVersion(info.version)
      setShowNotes(info.notesUnseen)
    })
  }, [])

  const closeNotes = () => {
    setShowNotes(false)
    window.api.markNotesSeen()
  }

  const current = RELEASE_NOTES.find((r) => r.version === version)

  const navButton = (s: { id: SectionId; label: string }) => (
    <button
      key={s.id}
      type="button"
      className={s.id === active ? 'script-item active' : 'script-item'}
      onClick={() => setActive(s.id)}
    >
      <span className="script-name">{s.label}</span>
    </button>
  )

  return (
    <div className="manager">
      <nav className="nav">
        <div className="nav-header">Settings</div>
        {SECTIONS.map(navButton)}
        <span className="spacer" />
        {FOOTER_SECTIONS.map(navButton)}
        <div className="nav-version muted">v{version}</div>
      </nav>
      <Component />
      {showNotes && current && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="section-title">What's new in {current.version}</h2>
            <ul className="notes">
              {current.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className="actions">
              <span className="spacer" />
              <button type="button" className="btn primary" onClick={closeNotes}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsWindow
