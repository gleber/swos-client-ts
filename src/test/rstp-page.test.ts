import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { http, HttpResponse, server } from './setup.js'

describe('RstpPage', () => {
  let client: SwOSClient

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password')
  })

  it('should load rstp data from real device response', async () => {
    const rawResponse = '{ena:1,role:["3","3","3","3","3","3"],lrn:e,cst:["0","4","4","4","0","0"]}'

    server.use(
      http.get('http://192.168.1.4/rstp.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const result = await client.rstp.load()
    expect(result.isResult()).toBe(true)
    const rstp = result.getResult()

    expect(rstp).toMatchObject({
      enabled: true,
      ports: [
        { role: 3, status: 0, priority: 0, cost: 0, portId: 0 },
        { role: 3, status: 1, priority: 0, cost: 4, portId: 0 },
        { role: 3, status: 1, priority: 0, cost: 4, portId: 0 },
        { role: 3, status: 1, priority: 0, cost: 4, portId: 0 },
        { role: 3, status: 0, priority: 0, cost: 0, portId: 0 },
        { role: 3, status: 0, priority: 0, cost: 0, portId: 0 },
      ],
    })
  })
  it('should save rstp data', async () => {
    const rawResponse = '{ena:1,role:["3","3","3","3","3","3"],lrn:e,cst:["0","4","4","4","0","0"]}'

    server.use(
      http.get('http://192.168.1.4/rstp.b', () => {
        return HttpResponse.text(rawResponse)
      }),
      http.post('http://192.168.1.4/rstp.b', async ({ request }) => {
        const body = await request.text()
        // Check ena bitmask. 6 ports -> 0x3F (63).
        // toMikrotik converts number to 0x...UpperCase
        expect(body).toContain('ena:0x3F')
        return HttpResponse.text(rawResponse)
      })
    )

    // Explicitly set numPorts usually handled by SwOSClient.fetchAll or internal load
    // But RstpPage.load sets numPorts from role.length.
    // So calling load is enough.

    await client.rstp.load()

    if (client.rstp.rstp) {
      client.rstp.rstp.enabled = true
    }

    const result = await client.rstp.save()
    expect(result.isResult()).toBe(true)
  })
})
