import { useState } from 'react'

const BackupSection = () => {
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)

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
    </div>
  )
}

export default BackupSection
