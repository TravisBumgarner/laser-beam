import { createRoot } from 'react-dom/client'
import App from './App'
import SettingsWindow from './settings/SettingsWindow'
import './styles.css'

const isSettings = window.location.hash === '#settings'
if (isSettings) document.body.classList.add('window')

createRoot(document.getElementById('root') as HTMLElement).render(isSettings ? <SettingsWindow /> : <App />)
