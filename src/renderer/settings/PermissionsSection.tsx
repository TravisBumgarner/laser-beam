import { PermissionAction, usePermissions } from './usePermissions'

const PermissionsSection = ({ onRunSetup }: { onRunSetup: () => void }) => {
  const { permissions, asking, request } = usePermissions()

  return (
    <div className="section">
      <h2 className="section-title">Permissions</h2>
      <p className="muted">macOS asks for these the first time a feature needs them. Grant them here to skip that.</p>
      <div className="hotkey-group">
        {permissions.map((p) => (
          <div className="hotkey-row" key={p.id}>
            <div className="permission-text">
              <span>{p.label}</span>
              <span className="muted">{p.why}</span>
            </div>
            <PermissionAction permission={p} asking={asking} request={request} />
          </div>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onRunSetup}>
          Run setup again
        </button>
      </div>
    </div>
  )
}

export default PermissionsSection
