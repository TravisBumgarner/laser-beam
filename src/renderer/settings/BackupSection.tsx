import { useEffect, useState } from 'react'
import type { BackupFrequency, BackupSchedule } from '../../shared/api'

const FREQUENCIES: { value: BackupFrequency; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly (1st)' },
]

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const BackupSection = () => {
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null)

  useEffect(() => {
    window.api.getBackupSchedule().then(setSchedule)
  }, [])

  const update = async (changes: Partial<BackupSchedule>) => {
    if (!schedule) return
    const { lastRun: _, ...rest } = { ...schedule, ...changes }
    setSchedule(await window.api.setBackupSchedule(rest))
  }

  const pickFolder = async () => {
    const folder = await window.api.pickFolder()
    if (folder) update({ folder })
  }

  const run = async (action: () => Promise<string | null>) => {
    setStatus(null)
    try {
      const text = await action()
      if (text) setStatus({ text, error: false })
    } catch (error) {
      setStatus({ text: String(error).replace(/^.*Error: /, ''), error: true })
    }
  }

  return (
    <div className="section">
      <h2 className="section-title">Backup</h2>
      <p className="muted">Export saves all scripts to a JSON file. Import replaces your scripts with the file's.</p>
      <div className="actions">
        <button type="button" className="btn primary" onClick={() => run(window.api.exportAll)}>
          Export everything
        </button>
        <button type="button" className="btn" onClick={() => run(window.api.importAll)}>
          Import everything
        </button>
      </div>
      {status && <div className={status.error ? 'error' : 'ok'}>{status.text}</div>}
      {schedule && (
        <div className="hotkey-group">
          <div className="sidebar-header flat">
            <span>Automatic backups</span>
          </div>
          <div className="hotkey-row">
            <span>Frequency</span>
            <span className="actions">
              <select
                className="field select"
                value={schedule.frequency}
                onChange={(e) => update({ frequency: e.target.value as BackupFrequency })}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              {schedule.frequency === 'weekly' && (
                <select
                  className="field select"
                  value={schedule.weekday}
                  onChange={(e) => update({ weekday: Number(e.target.value) })}
                >
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </span>
          </div>
          <div className="hotkey-row">
            <span>Folder</span>
            <span className="actions">
              <span className="mono">{schedule.folder}</span>
              <button type="button" className="btn small" onClick={pickFolder}>
                Change
              </button>
            </span>
          </div>
          <div className="hotkey-row">
            <span>Last backup</span>
            <span className="muted">{schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackupSection
