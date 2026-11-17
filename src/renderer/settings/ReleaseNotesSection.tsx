import { RELEASE_NOTES } from '../../shared/releaseNotes'

const ReleaseNotesSection = () => (
  <div className="section">
    <h2 className="section-title">Release notes</h2>
    {RELEASE_NOTES.map((r) => (
      <div key={r.version} className="hotkey-group">
        <div className="label">{r.version}</div>
        <ul className="notes">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)

export default ReleaseNotesSection
