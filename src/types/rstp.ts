import type { RstpRole, RstpState } from './mikrotik-fields.js'

export interface RstpPort {
  role: RstpRole
  status: RstpState
  priority: number
  cost: number
  portId: number
}

export interface Rstp {
  enabled: boolean
  ports: RstpPort[]
}

export interface RawRstpStatus {
  rpc: string[]
  cst: string[]
  ena: string
  rstp: string
  p2p: string
  edge: string
  lrn: string
  fwd: string
  role: string[]
  prio?: string[]
  pid?: string[]
}
