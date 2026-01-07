import { describe, expect, it } from 'vitest'
import { aggregateSwOSData } from '../core/swos-aggregator'
import type { SwOSData } from '../core/swos-client'
import { LinkStatus } from '../types/mikrotik-fields'
import { VlanPortMode } from '../types/vlan'

describe('SwOS Aggregator', () => {
  it('should aggregate data correctly for a simple 2-port switch', () => {
    const mockData: SwOSData = {
      sys: {
        identity: 'MikroTik',
        version: '2.13',
        serial: '123456',
        mac: '00:11:22:33:44:55',
        uptime: '100s',
        boardName: 't',
        temperature: 30,

        voltage: 24,
        ports: [
          {
            mikrotikDiscoveryProtocol: true,
            allowFrom: true,
            igmpFastLeave: false,
            trusted: false,
          },
          {
            mikrotikDiscoveryProtocol: true,
            allowFrom: true,
            igmpFastLeave: false,
            trusted: false,
          },
        ],
      },
      links: [
        {
          name: 'Port1',
          enabled: true,
          linkStatus: LinkStatus.LinkOn,
          duplex: 1,
          duplexControl: true,
          flowControl: 1,
          autoNegotiation: true,
          poeMode: 'auto',
          poePrio: 0,
          poeStatus: 'active',
          speed: 1000,
          speedControl: 1000,
          power: 0,
          current: 0,
        },
        {
          name: 'Port2',
          enabled: true,
          linkStatus: LinkStatus.NoLink,
          duplex: 1,
          duplexControl: true,
          flowControl: 1,
          autoNegotiation: true,
          poeMode: 'auto',
          poePrio: 0,
          poeStatus: 'active',
          speed: 1000,
          speedControl: 1000,
          power: 0,
          current: 0,
        },
      ],
      vlan: [
        {
          id: 10,
          members: '3', // Binary 11 -> Ports 0 and 1 are members
          independentVlanLookup: false,
          igmpSnooping: false,
          portMode: [VlanPortMode.LeaveAsIs, VlanPortMode.AlwaysStrip],
        },
        {
          id: 20,
          members: '2', // Binary 10 -> Port 1 is member
          independentVlanLookup: false,
          igmpSnooping: false,
          portMode: [VlanPortMode.LeaveAsIs, VlanPortMode.LeaveAsIs],
        },
      ],
      sfp: [
        {
          vendor: 'Mikrotik',
          partNumber: 'S-RJ01',
          serialNumber: 'ABC',
          temperature: 30,
          txPower: 0,
          rxPower: 0,
          voltage: 3300,
        },
      ],
      // ... fill other optional fields if needed for test coverage
    } as unknown as SwOSData

    const aggregated = aggregateSwOSData(mockData)

    const { ports: _sysPorts, ...expectedSys } = mockData.sys
    expect(aggregated.sys).toEqual(expectedSys)
    expect(aggregated.ports).toHaveLength(2)

    // Check Port 1
    const p1 = aggregated.ports[0]
    expect(p1.id).toBe(0)
    expect(p1.portNumber).toBe(1)
    expect(p1.name).toBe('Port1')
    expect(p1.link).toEqual(mockData.links[0])
    expect(p1.vlanMemberships).toHaveLength(1)
    expect(p1.vlanMemberships[0]).toEqual({ vlanId: 10, mode: VlanPortMode.LeaveAsIs })
    // SFP mapping: 1 sfp entry, 2 ports. Should map to last port (Port 2).
    expect(p1.sfp).toBeUndefined()
    expect(p1.connectorType).toBe('copper')
    expect(p1.sys).toEqual(mockData.sys.ports[0])

    // Check Port 2
    const p2 = aggregated.ports[1]
    expect(p2.id).toBe(1)
    expect(p2.portNumber).toBe(2)
    expect(p2.vlanMemberships).toHaveLength(2)
    // Sorted by ID
    expect(p2.vlanMemberships[0]).toEqual({ vlanId: 10, mode: VlanPortMode.AlwaysStrip })
    expect(p2.vlanMemberships[1]).toEqual({ vlanId: 20, mode: VlanPortMode.LeaveAsIs })
    // SFP mapping
    expect(p2.sfp).toEqual(mockData.sfp?.[0])
    expect(p2.connectorType).toBe('sfp')
  })
})
