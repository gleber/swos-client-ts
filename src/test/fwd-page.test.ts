import { Effect } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { http, HttpResponse, server } from './setup.js'

describe('FwdPage', () => {
  let client: SwOSClient

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password')
  })

  it('should load fwd data from real device response', async () => {
    const rawResponse =
      '{ir:0,or:0,fp1:3f,fp2:3f,fp3:3f,fp4:3f,fp5:3f,fp6:3f,lck:0,imr:0,vlan:["1","1","1","1","1","1"],dvid:["1","1","1","1","1","1"],vlni:["0","0","0","0","0","0"],srt:["0","0","0","0","0","0"]}'

    server.use(
      http.get('http://192.168.1.4/fwd.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const fwd = await Effect.runPromise(client.fwd.load())

    expect(fwd).toMatchObject({
      mirror: 0,
      ports: [
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
        {
          enabled: true,
          linkUp: false,
          flowControl: false,
          defaultVlanId: 1,
          vlanId: 1,
          vlanMode: 0,
          locked: false,
          rateLimit: 0,
          broadcastLimit: 0,
          multicastLimit: 0,
          unicastLimit: 0,
        },
      ],
    })
  })
  it('should save fwd data', async () => {
    const rawResponse =
      '{ir:0,or:0,fp1:3f,fp2:3f,fp3:3f,fp4:3f,fp5:3f,fp6:3f,lck:0,imr:0,vlan:["1","1","1","1","1","1"],dvid:["1","1","1","1","1","1"],vlni:["0","0","0","0","0","0"],srt:["0","0","0","0","0","0"]}'

    server.use(
      http.get('http://192.168.1.4/fwd.b', () => {
        return HttpResponse.text(rawResponse)
      }),
      http.post('http://192.168.1.4/fwd.b', async ({ request }) => {
        const body = await request.text()
        // Check changed fields
        // locked port 0 -> lck: 0x01
        expect(body).toContain('lck:0x1') // assuming hex format 0x...
        expect(body).toContain('fp1:0x3F')
        return HttpResponse.text(rawResponse)
      })
    )

    const fwd = await Effect.runPromise(client.fwd.load())

    // Toggle locked on first port
    fwd.ports[0].locked = true

    await Effect.runPromise(client.fwd.save(fwd))
  })
})
