import { useEffect, useState } from 'react'

const GeneralSection = () => {
  const [launchAtLogin, setLaunchAtLogin] = useState<boolean | null>(null)

  useEffect(() => {
    window.api.getSettings().then((s) => setLaunchAtLogin(s.launchAtLogin))
  }, [])

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
    </div>
  )
}

export default GeneralSection
