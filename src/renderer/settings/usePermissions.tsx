import { useCallback, useEffect, useState } from 'react'
import type { Permission, PermissionId } from '../../shared/api'

// Rechecks whenever the window regains focus, since permissions get switched on over in System Settings.
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [asking, setAsking] = useState<PermissionId | null>(null)

  const refresh = useCallback(() => window.api.listPermissions().then(setPermissions), [])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const request = async (id: PermissionId) => {
    setAsking(id)
    try {
      setPermissions(await window.api.requestPermission(id))
    } finally {
      setAsking(null)
    }
  }

  return { permissions, asking, request }
}

export const STATUS_LABEL = { granted: 'Granted', missing: 'Not granted', unknown: 'Not asked yet' }

export const PermissionAction = ({
  permission,
  asking,
  request,
}: {
  permission: Permission
  asking: PermissionId | null
  request: (id: PermissionId) => void
}) => (
  <div className="permission-action">
    <span className={`permission-status ${permission.status}`}>{STATUS_LABEL[permission.status]}</span>
    {permission.status !== 'granted' && (
      <button type="button" className="btn small" disabled={asking !== null} onClick={() => request(permission.id)}>
        {asking === permission.id ? 'Waiting…' : permission.status === 'missing' ? 'Open Settings' : 'Grant'}
      </button>
    )}
  </div>
)
