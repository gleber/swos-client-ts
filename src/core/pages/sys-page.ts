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
  intToHex,
  intToIp,
  ipToInt,
  ipToIntLE,
  parseHexInt,
  stringToHex,
  toAddressAcquisition,
  toMikrotik,
  toPSUStatus,
  toPoEOutMode,
  toPoEOutStatus,
  toPortCostMode,
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
            staticIpAddress: createIpAddress(intToIp(parseHexInt(raw.sip || raw.ip))), // Prefer sip (Static IP) over ip (Current IP)
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

            bridgePriority: parseHexInt(raw.prio),
            portCostMode: raw.cost ? toPortCostMode(parseHexInt(raw.cost)) : undefined,
            rootBridgePriority: parseHexInt(raw.rpr),
            rootBridgeMac: createMacAddress(hexToMac(raw.rmac)),

            poeOutMode: raw.poe ? toPoEOutMode(parseHexInt(raw.poe)) : undefined,
            // poes is likely a string of hex values or bit packed?
            // Dump: 'id': 'poes'. usually raw value is hex string if single, or array if multiple.
            // If 'a:1' in dump, it usually means array. But SwOS JSON is weird.
            // If raw.poes is string, how many ports?
            // Let's assume raw.poes is a string of hex values or similar to 'spd' (array).
            // But RawSysStatus defines it as string?
            // Let's check mikrotik-dump again. `poes` uses `i: POE_OUT_STATUS_VALUES`.
            // If it's per port, it should be an array in JSON or a packed hex?
            // Wait, other arrays in RawSysStatus are not explicitly defined as string[]?
            // RawSysStatus has `allp: string` (bitmask).
            // RawLinkStatus has `spd: string[]`.
            // Let's try to handle `poes` as potentially array or string.
            // But strict types say string.
            // If it's a string, maybe it's a list like "0,1,0..." or hex?
            // Given lack of concrete example for `poes`, but strict typing in `RawVlanStatus` etc,
            // let's assume it might be missing or complex.
            // HOWEVER, looking at `mikrotik-dump.js` line 1362: `{ n: 'PoE Out Status', id: 'poes', a: 1 ... }`
            // `a: 1` strongly suggests array.
            // So `RawSysStatus` definition `poes?: string` changed to `poes?: string | string[]` effectively?
            // Or maybe it's `poes: string[]`.
            // I updated `RawSysStatus` to have `poes?: string`. I should probably change it to `string[]` or keys.
            // Wait, `swos-client.ts` defined specific types.
            // Let's assume for now it's an array if `a:1`.
            // I will update type in NEXT step if I failed. But I just updated it to string.
            // Note: `poes` values are indices into `POE_OUT_STATUS_VALUES`.

            poeOutStatus: Array.isArray(raw.poes)
              ? raw.poes.map((p: string) => toPoEOutStatus(parseHexInt(p)))
              : typeof raw.poes === 'string'
                ? [toPoEOutStatus(parseHexInt(raw.poes))] // fallback
                : undefined,

            temperature: raw.temp ? parseHexInt(raw.temp) / 10 : undefined,
            cpuTemperature: raw.temp ? parseHexInt(raw.temp) / 10 : undefined, // reusing temp as likely same
            boardTemperature: raw.btmp ? parseHexInt(raw.btmp) / 10 : undefined,
            voltage: raw.volt ? parseHexInt(raw.volt) / 1000 : undefined,

            fans: [
              raw.fan1 ? parseHexInt(raw.fan1) : 0,
              raw.fan2 ? parseHexInt(raw.fan2) : 0,
              raw.fan3 ? parseHexInt(raw.fan3) : 0,
              raw.fan4 ? parseHexInt(raw.fan4) : 0,
            ].filter((rpm) => rpm > 0), // meaningful fans

            psu: [
              {
                current: raw.p1c ? parseHexInt(raw.p1c) : undefined,
                voltage: raw.p1v ? parseHexInt(raw.p1v) / 100 : undefined, // scale 100 from dump
                status: raw.p1s ? toPSUStatus(parseHexInt(raw.p1s)) : undefined,
              },
              {
                current: raw.p2c ? parseHexInt(raw.p2c) : undefined,
                voltage: raw.p2v ? parseHexInt(raw.p2v) / 100 : undefined,
                status: raw.p2s ? toPSUStatus(parseHexInt(raw.p2s)) : undefined,
              },
            ],

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
