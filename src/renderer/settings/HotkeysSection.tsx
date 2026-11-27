import { useEffect, useState } from 'react'

const GROUPS = (hotkey: string) => [
  {
    title: 'Global',
    keys: [['Open / close Laser Beam', hotkey]],
  },
  {
    title: 'Search bar',
    keys: [
      ['Chat with Claude', '> ai'],
      ['Add a Todo Today task', '> td'],
      ['Run a saved script', '> sc'],
      ['Open config', '> co'],
      ['Move selection', '↑ ↓'],
      ['Open selection', '↵'],
      ['Forget a remembered result', '⌘⌫'],
      ['Back', '⌘['],
      ['Close', 'esc'],
    ],
  },
  {
    title: 'Script editor',
    keys: [
      ['New script', '⌘N'],
      ['Save', '⌘S'],
      ['Test', '⌘↵'],
    ],
  },
]

const HotkeysSection = () => {
  const [hotkey, setHotkey] = useState('')

  useEffect(() => {
    window.api
      .getSettings()
      .then((s) => setHotkey(s.hotkey.replace('Alt', '⌥').replace('Command', '⌘').replace('+', ' ')))
  }, [])

  return (
    <div className="section hotkeys">
      <h2 className="section-title">Hotkeys</h2>
      {GROUPS(hotkey).map((group) => (
        <div key={group.title} className="hotkey-group">
          <div className="label">{group.title}</div>
          {group.keys.map(([action, key]) => (
            <div key={action} className="hotkey-row">
              <span>{action}</span>
              <kbd className="chip">{key}</kbd>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default HotkeysSection
