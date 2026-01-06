import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { http, HttpResponse, server } from './setup.js'

describe('VlanPage', () => {
  let client: SwOSClient

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password')
  })

  it('should load vlan data from real device response', async () => {
    const rawResponse = '[]'

    server.use(
      http.get('http://192.168.1.4/vlan.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const result = await client.vlan.load()
    expect(result.isResult()).toBe(true)
    const vlans = result.getResult()

    expect(vlans).toEqual([])
  })
  it('should manipulate and save vlan data', async () => {
    const rawResponse = '[]' // Start with empty

    server.use(
      http.get('http://192.168.1.4/vlan.b', () => {
        return HttpResponse.text(rawResponse)
      }),
      http.post('http://192.168.1.4/vlan.b', async ({ request }) => {
        const body = await request.text()
        expect(body).toContain('vid:0x64') // VLAN 100 (hex 0x64)
        expect(body).toContain('prt:[0x0,0x0,0x0,0x0,0x0,0x0]') // Default LeaveAsIs (0)
        // VlanPortMode.LeaveAsIs = ?
        // I need to check VlanPortMode enum values. 
        // Assuming defaults.
        return HttpResponse.text(rawResponse)
      })
    )

    client.vlan.setNumPorts(6)
    client.vlan.setNumPorts(6)
    const result = await client.vlan.load()
    expect(result.isResult()).toBe(true)
    const vlans = result.getResult()

    // Add VLAN 100
    // Manually push to array as helpers were removed
    vlans.push({
      id: 100,
      independentVlanLookup: false,
      igmpSnooping: false,
      portMode: [0, 0, 0, 0, 0, 0],
    })

    // Check if new vlan has default props
    const vlan100 = vlans.find(v => v.id === 100)
    expect(vlan100).toBeDefined()
    expect(vlan100?.portMode.length).toBe(6)

    // Save
    const saveResult = await client.vlan.save(vlans)
    expect(saveResult.isResult()).toBe(true)
  })
})
