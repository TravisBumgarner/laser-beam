import { useState } from 'react'
import BackupSection from './BackupSection'
import HotkeysSection from './HotkeysSection'
import PresetsSection from './PresetsSection'
import ScriptsSection from './ScriptsSection'

const SECTIONS = [
  { id: 'hotkeys', label: 'Hotkeys', Component: HotkeysSection },
  { id: 'scripts', label: 'Scripts', Component: ScriptsSection },
  { id: 'presets', label: 'Presets', Component: PresetsSection },
  { id: 'backup', label: 'Backup', Component: BackupSection },
] as const

const SettingsWindow = () => {
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('hotkeys')
  const { Component } = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0]

  return (
    <div className="manager">
      <nav className="nav">
        <div className="nav-header">Settings</div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === active ? 'script-item active' : 'script-item'}
            onClick={() => setActive(s.id)}
          >
            <span className="script-name">{s.label}</span>
          </button>
        ))}
      </nav>
      <Component />
    </div>
  )
}

export default SettingsWindow
