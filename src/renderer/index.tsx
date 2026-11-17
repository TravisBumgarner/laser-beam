import { createRoot } from 'react-dom/client'
import App from './App'
import SettingsWindow from './settings/SettingsWindow'
import { applyTheme } from './themes'
import './styles.css'

const isSettings = window.location.hash === '#settings'
if (isSettings) document.body.classList.add('window')

window.api.getSettings().then((s) => applyTheme(s.theme))
window.api.onThemeChange(applyTheme)

createRoot(document.getElementById('root') as HTMLElement).render(isSettings ? <SettingsWindow /> : <App />)
