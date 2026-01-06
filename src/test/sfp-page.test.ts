import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { http, HttpResponse, server } from './setup.js'

describe('SfpPage', () => {
  let client: SwOSClient

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password')
  })

  it('should load sfp data from real device response', async () => {
    const rawResponse = '{vnd:,pnr:,ser:,tmp:ffffff80,tpw:0,rpw:0,vcc:0}'

    server.use(
      http.get('http://192.168.1.4/sfp.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const result = await client.sfp.load()
    expect(result.isResult()).toBe(true)
    const sfp = result.getResult()

    expect(sfp).toHaveLength(1)
    expect(sfp[0]).toMatchObject({
      vendor: '',
      partNumber: '',
      serialNumber: '',
      temperature: 4294967168,
      txPower: 0,
      rxPower: 0,
      voltage: 0,
    })
  })

  it('should handle SFP array response (multiple SFPs)', async () => {
    const rawResponse = `{vnd:['',''],pnr:['',''],rev:['',''],ser:['',''],dat:['',''],typ:['',''],wln:[0x00000000,0x00000000],tmp:[0xffffff80,0xffffff80],vcc:[0x0000,0x0000],tbs:[0x0000,0x0000],tpw:[0x0000,0x0000],rpw:[0x0000,0x0000]}`

    server.use(
      http.get('http://192.168.1.4/sfp.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    const result = await client.sfp.load()
    expect(result.isResult()).toBe(true)
    const sfp = result.getResult()

    expect(Array.isArray(sfp)).toBe(true)
    expect(sfp).toHaveLength(2)
    // @ts-ignore
    expect(sfp[0].temperature).toBe(4294967168) // 0xffffff80
  })
})
