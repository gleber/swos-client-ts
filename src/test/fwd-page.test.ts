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

  it('should load fwd data from 26-port switch', async () => {
    // Real data from 24 port + 2 SFP switch
    const rawResponse =
      '{fp1:0x00000002,fp2:0x00000001,fp3:0x03fffff8,fp4:0x03fffff4,fp5:0x03ffffec,fp6:0x03ffffdc,fp7:0x03ffffbc,fp8:0x03ffff7c,fp9:0x03fffefc,fp10:0x03fffdfc,fp11:0x03fffbfc,fp12:0x03fff7fc,fp13:0x03ffeffc,fp14:0x03ffdffc,fp15:0x03ffbffc,fp16:0x03ff7ffc,fp17:0x03fefffc,fp18:0x03fdfffc,fp19:0x03fbfffc,fp20:0x03f7fffc,fp21:0x03effffc,fp22:0x03dffffc,fp23:0x03bffffc,fp24:0x037ffffc,fp25:0x02fffffc,fp26:0x01fffffc,lck:0x00000000,lckf:0x00000000,imr:0x00000000,omr:0x00000000,mrto:0x00000001,vlan:[0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01],vlni:[0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],dvid:[0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001,0x0001],fvid:0x00000000,srt:[0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64,0x64],suni:0x00000000,fmc:0x03ffffff,ir:[0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000]}'

    server.use(
      http.get('http://192.168.1.4/fwd.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const fwd = await Effect.runPromise(client.fwd.load())

    // Verify we have 26 ports
    expect(fwd.ports).toHaveLength(26)

    // Check first port's data
    expect(fwd.ports[0]).toMatchObject({
      enabled: true, // fp1 = 0x00000002 (non-zero)
      defaultVlanId: 1,
      vlanId: 1,
      vlanMode: 0,
      locked: false,
      rateLimit: 100, // 0x64
    })

    // Check last port's data
    expect(fwd.ports[25]).toMatchObject({
      enabled: true, // fp26 = 0x01fffffc (non-zero)
      defaultVlanId: 1,
      vlanId: 1,
      vlanMode: 0,
      locked: false,
      rateLimit: 100,
    })

    // Verify mirror setting
    expect(fwd.mirror).toBe(0) // imr = 0x00000000
  })
})
