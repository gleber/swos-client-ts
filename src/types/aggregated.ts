import type { FwdPort } from './fwd.js'
import type { LagPort } from './lag.js'
import type { Link } from './link.js'
import type { RstpPort } from './rstp.js'
import type { SfpStatus } from './sfp.js'
import type { PortStats } from './stat.js'
import type { Sys, SysPort } from './sys.js'
import type { VlanPortMode } from './vlan.js'

export interface PortVlanMembership {
  vlanId: number
  mode: VlanPortMode
}

export interface PortInfo {
  id: number // 0-based index
  portNumber: number // 1-based index (for UI display)
  name: string

  connectorType: 'copper' | 'sfp' | 'combo' | 'virtual' // Deduced type

  link?: Link
  stats?: PortStats
  forwarding?: FwdPort
  rstp?: RstpPort
  sfp?: SfpStatus
  lag?: LagPort
  sys?: SysPort

  // Computed from VLAN page
  vlanMemberships: PortVlanMembership[]
}

export interface SwOSAggregatedState {
  sys: Omit<Sys, 'ports'>
  ports: PortInfo[]
}
