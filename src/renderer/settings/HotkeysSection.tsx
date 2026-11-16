import { useEffect, useState } from 'react'

const GROUPS = (hotkey: string) => [
  {
    title: 'Global',
    keys: [['Open / close Laser Beam', hotkey]],
  },
  {
    title: 'Search bar',
    keys: [
      ['Chat with Claude', 'ai_'],
      ['Add a Todo Today task', 'td_'],
      ['Run a saved script', 'sc_'],
      ['Open config', 'co_'],
      ['Move selection', '↑ ↓'],
      ['Open selection', '↵'],
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
    window.api.getSettings().then((s) => setHotkey(s.hotkey.replace('Alt', '⌥').replace('+', ' ')))
  }, [])

  return (
    <div className="section">
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
