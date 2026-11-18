import { useState } from 'react'
import { PermissionAction, usePermissions } from './usePermissions'

// Steps: welcome, one per permission, then done.
const SetupWizard = ({ onClose }: { onClose: () => void }) => {
  const { permissions, asking, request } = usePermissions()
  const [step, setStep] = useState(0)
  const last = permissions.length + 1
  const permission = step > 0 && step < last ? permissions[step - 1] : null

  const finish = () => {
    window.api.completeSetup()
    onClose()
  }

  return (
    <div className="modal-backdrop">
      <div className="modal setup-wizard">
        {step === 0 && (
          <>
            <h2 className="section-title">Welcome to Laser Beam</h2>
            <p className="muted">
              A few features need macOS permissions. Grant them now so nothing interrupts you later. You can change them
              any time in Settings → Permissions.
            </p>
          </>
        )}
        {permission && (
          <>
            <div className="muted setup-step">
              Step {step} of {permissions.length}
            </div>
            <h2 className="section-title">{permission.label}</h2>
            <p className="muted">{permission.why}</p>
            <PermissionAction permission={permission} asking={asking} request={request} />
          </>
        )}
        {step === last && (
          <>
            <h2 className="section-title">All set</h2>
            <p className="muted">Press your hotkey to open Laser Beam.</p>
          </>
        )}
        <div className="actions">
          {step < last && (
            <button type="button" className="btn" onClick={finish}>
              Skip setup
            </button>
          )}
          <span className="spacer" />
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < last ? (
            <button type="button" className="btn primary" onClick={() => setStep(step + 1)}>
              {step === 0 ? 'Start' : 'Next'}
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={finish}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
