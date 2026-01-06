import { beforeEach, describe, expect, it } from 'vitest'
import { SwOSClient } from '../core/swos-client.js'
import { http, HttpResponse, server } from './setup.js'

describe('SysPage', () => {
  let client: SwOSClient

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password')
  })

  it('should load sys data from real device response', async () => {
    const raw = {
      upt: '0x059e2a34',
      ip: '0x0401a8c0',
      mac: '085531001b19',
      sid: '443533443044423631453543',
      id: '6f66666963652d726f75746572',
      ver: '322e3133',
      brd: '4353533130362d35472d3153',
      bld: '0x608677f1',
      wdt: '0x01',
      dsc: '0x01',
      ivl: '0x00',
      alla: '0x00000000',
      allm: '0x00',
      allp: '0x3f',
      avln: '0x0000',
      prio: '0x8000',
      cost: '0x00',
      rpr: '0x8000',
      rmac: '085531001b19',
      igmp: '0x00',
      sip: '0x0458a8c0',
      iptp: '0x00',
      volt: '0x0000',
      temp: '0x00000000',
      lcbl: '0x00',
      upgr: '0x00',
      igfl: '0x00',
    }
    const rawResponse = JSON.stringify(raw)

    server.use(
      http.get('http://192.168.1.4/sys.b', () => {
        return HttpResponse.text(rawResponse)
      })
    )

    client.sys.setNumPorts(6)

    const result = await client.sys.load()
    expect(result.isResult()).toBe(true)
    const sys = result.getResult()

    expect(sys).toMatchObject({
      mac: '08:55:31:00:1b:19',
      serialNumber: '443533443044423631453543',
      identity: 'office-router',
      version: '2.13',
      boardName: 'CSS106-5G-1S',
      rootBridgeMac: '08:55:31:00:1b:19',
      ip: '192.168.1.4',
      build: 1619425265,
      dsc: 1,
      wdt: 1,
      independentVlanLookup: false,
      allowFrom: '0.0.0.0',
      allm: 0,
      allowFromVlan: 0,
      igmpSnooping: false,
      igmpQuerier: false,
      longPoeCable: false,
      igmpVersion: 0,
      voltage: 0,
      temperature: 0,
      bridgePriority: 32768,
      portCostMode: 0,
      forwardReservedMulticast: false,
      addressAcquisition: 0,
      staticIpAddress: '192.168.88.4',
      ports: [
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
        { mikrotikDiscoveryProtocol: false, allowFrom: true, igmpFastLeave: false },
      ],
    })
  })
  it('should save sys data', async () => {
    // raw values for mock
    const raw = {
      upt: '0x059e2a34',
      ip: '0x0401a8c0',
      mac: '085531001b19',
      sid: '443533443044423631453543',
      id: '6f66666963652d726f75746572', // "office-router"
      ver: '322e3133',
      brd: '4353533130362d35472d3153',
      bld: '0x608677f1',
      wdt: '0x01',
      dsc: '0x01',
      ivl: '0x00',
      alla: '0x00000000',
      allm: '0x00',
      allp: '0x3f',
      avln: '0x0000',
      prio: '0x8000',
      cost: '0x00',
      rpr: '0x8000',
      rmac: '085531001b19',
      igmp: '0x00',
      sip: '0x0458a8c0', // 192.168.88.4
      iptp: '0x00',
      volt: '0x0000',
      temp: '0x00000000',
      lcbl: '0x00',
      upgr: '0x00',
      igfl: '0x00',
    }
    const rawResponse = JSON.stringify(raw)

    server.use(
      http.get('http://192.168.1.4/sys.b', () => {
        return HttpResponse.text(rawResponse)
      }),
      http.post('http://192.168.1.4/sys.b', async ({ request }) => {
        const body = await request.text()
        // Check updated fields
        expect(body).toContain("id:'74657374'")
        expect(body).toContain('sip:0x501A8C0')
        // 192.168.1.5 -> C0 A8 01 05. Little Endian Int: 0x0501A8C0 ?
        // ipToIntLE: bytes [192, 168, 1, 5] -> reverse [5, 1, 168, 192] -> 0x0501A8C0.
        // Wait, parsers.ts `ipToIntLE`:
        // const hex = parts.reverse().map(p => ...).join('')
        // return parseHexInt(hex)
        // 192.168.1.5 -> parts=[192,168,1,5] -> reverse=[5,1,168,192] -> "0501a8c0" -> int.
        // `toMikrotik` converts numbers to `0x...`.
        // So yes 0x0501A8C0 (or similar case).
        return HttpResponse.text(rawResponse)
      })
    )

    client.sys.setNumPorts(6)

    // Load first
    const loadResult = await client.sys.load()
    expect(loadResult.isResult()).toBe(true)
    const sys = loadResult.getResult()

    // Modify
    sys.identity = 'test'
    sys.staticIpAddress = '192.168.1.5'

    const result = await client.sys.save(sys)
    expect(result.isResult()).toBe(true)
  })
})
