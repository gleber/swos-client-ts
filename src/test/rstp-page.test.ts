import { Effect } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { RstpRole, RstpState } from '../types/mikrotik-fields.js'
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

    const rstp = await Effect.runPromise(client.rstp.load())

    expect(rstp).toMatchObject({
      enabled: true,
      ports: [
        { role: RstpRole.Designated, status: RstpState.Discarding, priority: 0, cost: 0, portId: 0 },
        { role: RstpRole.Designated, status: RstpState.Learning, priority: 0, cost: 4, portId: 0 },
        { role: RstpRole.Designated, status: RstpState.Learning, priority: 0, cost: 4, portId: 0 },
        { role: RstpRole.Designated, status: RstpState.Learning, priority: 0, cost: 4, portId: 0 },
        { role: RstpRole.Designated, status: RstpState.Discarding, priority: 0, cost: 0, portId: 0 },
        { role: RstpRole.Designated, status: RstpState.Discarding, priority: 0, cost: 0, portId: 0 },
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
        expect(body).toContain('ena:0x3F')
        return HttpResponse.text(rawResponse)
      })
    )

    const rstp = await Effect.runPromise(client.rstp.load())

    rstp.enabled = true

    await Effect.runPromise(client.rstp.save(rstp))
  })
})
