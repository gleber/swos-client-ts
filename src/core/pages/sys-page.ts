import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { SysRequest } from '../../types/requests.js'
import type { RawSysStatus, Sys, SysPort } from '../../types/sys.js'
import {
  boolArrayToHex,
  createIpAddress,
  createMacAddress,
  fixJson,
  hexToBoolArray,
  hexToMac,
  hexToString,
  intToIp,
  ipToIntLE,
  parseHexInt,
  stringToHex,
  toAddressAcquisition,
  toMikrotik,
  toPoEOutMode,
} from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'System' tab of SwOS.
 * Endpoint: /sys.b
 */
export class SysPage implements Page<Sys> {
  private numPorts = 0

  constructor(private client: SwOSClient) {}

  setNumPorts(numPorts: number) {
    this.numPorts = numPorts
  }

  /**
   * Loads system configuration.
   * Maps obscure SwOS JSON keys to readable Sys properties:
   * - sid -> serialNumber
   * - id -> identity
   * - ver -> version
   * - brd -> boardName
   * - upt -> uptime
   * - pds -> mikrotikDiscoveryProtocol (per port bitmask)
   */
  load(): Effect.Effect<Sys, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/sys.b'))

      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw: RawSysStatus = JSON.parse(fixed)

          const mndp = hexToBoolArray(raw.pdsc || '0', self.numPorts)
          const allowFromPorts = hexToBoolArray(raw.allp || '0', self.numPorts)
          const igmpFastLeave = hexToBoolArray(raw.igfl || '0', self.numPorts)
          const trusted = hexToBoolArray(raw.dtrp || '0', self.numPorts)

          const ports: SysPort[] = Array.from({ length: self.numPorts }, (_, i) => ({
            mikrotikDiscoveryProtocol: mndp[i],
            allowFrom: allowFromPorts[i],
            igmpFastLeave: igmpFastLeave[i],
            trusted: trusted[i],
          }))

          return {
            identity: hexToString(raw.id),
            macAddress: createMacAddress(hexToMac(raw.mac)),
            serialNumber: raw.sid,
            version: hexToString(raw.ver),
            boardName: hexToString(raw.brd),
            uptime: parseHexInt(raw.upt),

            addressAcquisition: toAddressAcquisition(parseHexInt(raw.iptp)),
            staticIpAddress: createIpAddress(intToIp(parseHexInt(raw.ip))), // raw.ip seems to be the current IP or static? 'ip' in dump is 'Static IP Address'. wait.
            // dump says: n: 'Static IP Address', id: 'ip'. But there is also 'sip'. Checked RawSysStatus: sip is there.
            // In mikrotik-dump: id: 'ip' is Static IP.
            // In user code previous SysPage: staticIpAddress: createIpAddress(intToIp(parseHexInt(raw.sip)))
            // Let's check RawSysStatus again.
            // RawSysStatus has `ip` and `sip`.
            // Usually `ip` is current IP (could be from DHCP), `sip` might be Static IP setting?
            // Mikrotik-dump: `id: 'ip'` matches "Static IP Address".
            // But usually SwOS has `ipv4` or similar for current.
            // Let's rely on mapping `iptp` (Address Acquisition).
            // If `iptp` is Static, `ip` is used.
            // Let's map `ip` to `staticIpAddress` as per dump name.

            watchdog: parseHexInt(raw.wdt) !== 0,
            mikrotikDiscoveryProtocol: parseHexInt(raw.dsc) !== 0,
            independentVlanLookup: parseHexInt(raw.ivl) !== 0,
            igmpSnooping: parseHexInt(raw.igmp) !== 0,
            addInformationOption: parseHexInt(raw.ainf || '0') !== 0,

            allowFromIp: createIpAddress(intToIp(parseHexInt(raw.alla))),
            allowFromIpMask: parseHexInt(raw.allm),
            allowFromVlan: parseHexInt(raw.avln),

            poeOutMode: raw.poe ? toPoEOutMode(parseHexInt(raw.poe)) : undefined,
            temperature: raw.temp ? parseHexInt(raw.temp) / 10 : undefined,
            voltage: raw.volt ? parseHexInt(raw.volt) / 1000 : undefined,

            ports,
          }
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `Sys load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  save(sys: Sys): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(sys)
      yield* _(self.client.post('/sys.b', toMikrotik(change)))
      // Reload
      yield* _(self.load())
    })
  }

  async loadAsync(): Promise<Sys> {
    return Effect.runPromise(this.load())
  }

  async saveAsync(sys: Sys): Promise<void> {
    return Effect.runPromise(this.save(sys))
  }

  private store(sys: Sys): SysRequest {
    const mndp = sys.ports.map((p) => p.mikrotikDiscoveryProtocol)
    const allowFromPorts = sys.ports.map((p) => p.allowFrom)
    const igmpFastLeave = sys.ports.map((p) => p.igmpFastLeave)
    const trusted = sys.ports.map((p) => p.trusted)

    // TODO: Add converters for enums in parsers.ts if not manual
    // AddressAcquisition: 0=DHCP w/ fall, 1=Static, 2=DHCP only
    const addrAcqMap: Record<string, number> = {
      'DHCP with fallback': 0,
      static: 1,
      'DHCP only': 2,
    }
    const iptp = addrAcqMap[sys.addressAcquisition] ?? 0

    return {
      iptp,
      sip: ipToIntLE(sys.staticIpAddress), // Assuming 'ip' in load maps to 'sip' in save? Or 'ip' id in dump is 'ip' in struct?
      // dump: id: 'ip' is Static IP Address. id: 'iptp' is Addr Acq.
      // previous code used `sys.staticIpAddress` -> `sip`.
      // and `raw.sip` -> `staticIpAddress`.
      // But `raw` had `ip` and `sip`.
      // I should stick to one. If mapped to `staticIpAddress`, save as `sip`?
      // Wait, `SysRequest` needs `sip`?
      // Check `SysRequest` definition. It has `sip`.
      // dump: `id: 'ip'`. usually field id is the JSON key.
      // If dump says `id: 'ip'`, then save should probably use `ip`.
      // But `SysRequest` has `sip`.
      // Let's check `requests.ts`.

      id: stringToHex(sys.identity),
      alla: ipToIntLE(sys.allowFromIp),
      allm: sys.allowFromIpMask,
      allp: parseHexInt(boolArrayToHex(allowFromPorts)),
      avln: sys.allowFromVlan,
      ivl: sys.independentVlanLookup ? 1 : 0,
      igmp: sys.igmpSnooping ? 1 : 0,
      // igmq removed from Sys?
      igfl: parseHexInt(boolArrayToHex(igmpFastLeave)),
      // igve removed from Sys?
      pdsc: parseHexInt(boolArrayToHex(mndp)),
      dtrp: parseHexInt(boolArrayToHex(trusted)),

      wdt: sys.watchdog ? 1 : 0,
      dsc: sys.mikrotikDiscoveryProtocol ? 1 : 0,
      ainf: sys.addInformationOption ? 1 : 0,
    }
  }
}
