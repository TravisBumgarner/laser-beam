import { useEffect, useState } from 'react'

const GeneralSection = () => {
  const [launchAtLogin, setLaunchAtLogin] = useState<boolean | null>(null)
  const [todoInstalled, setTodoInstalled] = useState<boolean | null>(null)
  const [hotkey, setHotkey] = useState<string | null>(null)
  const [hotkeyError, setHotkeyError] = useState<string | null>(null)

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setLaunchAtLogin(s.launchAtLogin)
      setTodoInstalled(s.todoInstalled)
      setHotkey(s.hotkey)
    })
  }, [])

  const chooseHotkey = async (key: string) => {
    setHotkeyError(await window.api.setHotkey(key))
    setHotkey((await window.api.getSettings()).hotkey)
  }

  const toggle = async () => {
    if (launchAtLogin === null) return
    setLaunchAtLogin((await window.api.setLaunchAtLogin(!launchAtLogin)).launchAtLogin)
  }

  return (
    <div className="section">
      <h2 className="section-title">General</h2>
      <div className="hotkey-row">
        <span>Launch at login</span>
        <button type="button" className={launchAtLogin ? 'chip active' : 'chip'} onClick={toggle}>
          {launchAtLogin ? 'On' : 'Off'}
        </button>
      </div>
      <div className="hotkey-row">
        <span>Open Laser Beam with</span>
        <span className="actions">
          {[
            ['Alt+Space', '⌥ Space'],
            ['Command+Space', '⌘ Space'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={hotkey === key ? 'chip active' : 'chip'}
              onClick={() => chooseHotkey(key)}
            >
              {label}
            </button>
          ))}
        </span>
      </div>
      {hotkeyError && (
        <div className="hotkey-row">
          <span className="error">{hotkeyError}</span>
          <button type="button" className="btn small" onClick={() => window.api.openKeyboardShortcuts()}>
            Keyboard Shortcuts
          </button>
        </div>
      )}
      <div className="hotkey-row">
        <span>
          Todo Today{' '}
          <span className="muted">
            {todoInstalled === false ? "isn't installed, so > td is hidden" : todoInstalled ? 'installed' : ''}
          </span>
        </span>
        <button type="button" className="btn small" onClick={() => window.api.getTodoToday()}>
          Get Todo Today
        </button>
      </div>
    </div>
  )
}

export default GeneralSection
