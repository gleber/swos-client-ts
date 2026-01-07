import type { PortInfo, PortVlanMembership, SwOSAggregatedState } from '../types/aggregated.js'
import { ComboMode, QSFPType } from '../types/mikrotik-fields.js'
import { parseHexInt } from '../utils/parsers.js'
import type { SwOSClient, SwOSData } from './swos-client.js'

export function aggregateSwOSData(data: SwOSData): SwOSAggregatedState {
  const numPorts = data.links.length
  const ports: PortInfo[] = []

  // SFP Mapping Strategy
  const sfpData = data.sfp || []
  const sfpOffset = numPorts - sfpData.length

  for (let i = 0; i < numPorts; i++) {
    const portId = i
    const portNumber = i + 1

    // VLAN Memberships
    const vlanMemberships: PortVlanMembership[] = []
    if (data.vlan) {
      for (const vlan of data.vlan) {
        const membersMask = parseHexInt(vlan.members)
        const isMember = ((membersMask >> i) & 1) !== 0

        if (isMember) {
          const mode = vlan.portMode[i]
          if (mode) {
            vlanMemberships.push({
              vlanId: vlan.id,
              mode: mode,
            })
          }
        }
      }
    }

    vlanMemberships.sort((a, b) => a.vlanId - b.vlanId)

    // SFP Mapping
    let sfpStr: import('../types/sfp.js').SfpStatus | undefined
    if (sfpData.length === numPorts) {
      sfpStr = sfpData[i]
    } else if (i >= sfpOffset && sfpOffset >= 0) {
      sfpStr = sfpData[i - sfpOffset]
    }

    const link = data.links[i]

    // Type Deduction
    let connectorType: 'copper' | 'sfp' | 'combo' | 'virtual' = 'copper'
    if (link.comboMode) {
      connectorType = 'combo'
    } else if (link.qsfpType) {
      connectorType = 'sfp' // Treat QSFP as SFP category
    } else if (sfpStr) {
      connectorType = 'sfp'
    } else if (link.name.toUpperCase().includes('SFP')) {
      connectorType = 'sfp'
    }

    const info: PortInfo = {
      id: portId,
      portNumber: portNumber,
      name: link.name,
      connectorType,
      link: link,
      stats: data.stats ? data.stats[i] : undefined,
      forwarding: data.fwd ? data.fwd.ports[i] : undefined,
      rstp: data.rstp ? data.rstp.ports[i] : undefined,
      lag: data.lag ? data.lag[i] : undefined,
      sfp: sfpStr,
      sys: data.sys.ports[i],
      vlanMemberships,
    }

    ports.push(info)
  }

  // Create Sys without ports property
  // Use destructing to omit ports.
  const { ports: _sysPorts, ...sysRest } = data.sys

  return {
    sys: sysRest,
    ports,
  }
}
