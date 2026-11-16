import type { ReactNode } from 'react'
import Tips from '../Tips'

type Props = { title: string; tips: string[]; children: ReactNode }

const Panel = ({ title, tips, children }: Props) => (
  <div className="panel">
    <div className="panel-title">{title}</div>
    <div className="panel-body">{children}</div>
    <Tips tips={tips} />
  </div>
)

export default Panel
