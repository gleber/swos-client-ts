import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { SysRequest } from '../../types/requests.js'
import type { RawSysStatus, Sys, SysPort } from '../../types/sys.js'
import {
  boolArrayToHex,
  fixJson,
  hexToBoolArray,
  hexToMac,
  hexToString,
  intToIp,
  ipToIntLE,
  parseHexInt,
  stringToHex,
  toMikrotik,
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
          const allowFromPorts = hexToBoolArray(raw.allp, self.numPorts)
          const igmpFastLeave = hexToBoolArray(raw.igfl, self.numPorts)

          const ports: SysPort[] = Array.from({ length: self.numPorts }, (_, i) => ({
            mikrotikDiscoveryProtocol: mndp[i],
            allowFrom: allowFromPorts[i],
            igmpFastLeave: igmpFastLeave[i],
          }))

          return {
            mac: hexToMac(raw.mac),
            serialNumber: raw.sid,
            identity: hexToString(raw.id),
            version: hexToString(raw.ver),
            boardName: hexToString(raw.brd),
            rootBridgeMac: hexToMac(raw.rmac),
            uptime: parseHexInt(raw.upt),
            ip: intToIp(parseHexInt(raw.ip)),
            build: parseHexInt(raw.bld),
            dsc: parseHexInt(raw.dsc),
            wdt: parseHexInt(raw.wdt),
            independentVlanLookup: parseHexInt(raw.ivl) !== 0,
            allowFrom: intToIp(parseHexInt(raw.alla)),
            allm: parseHexInt(raw.allm),
            allowFromVlan: parseHexInt(raw.avln),
            igmpSnooping: parseHexInt(raw.igmp) !== 0,
            igmpQuerier: raw.igmq ? parseHexInt(raw.igmq) !== 0 : false,
            longPoeCable: parseHexInt(raw.lcbl) !== 0,
            igmpVersion: raw.igve ? parseHexInt(raw.igve) : 0,
            voltage: raw.volt ? parseHexInt(raw.volt) / 1000 : 0,
            temperature: raw.temp ? parseHexInt(raw.temp) / 10 : 0,
            bridgePriority: parseHexInt(raw.prio),
            portCostMode: parseHexInt(raw.cost),
            forwardReservedMulticast: raw.frmc ? parseHexInt(raw.frmc) !== 0 : false,
            addressAcquisition: parseHexInt(raw.iptp),
            staticIpAddress: intToIp(parseHexInt(raw.sip)),
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

    return {
      iptp: sys.addressAcquisition,
      sip: ipToIntLE(sys.staticIpAddress),
      id: stringToHex(sys.identity),
      alla: ipToIntLE(sys.allowFrom),
      allm: sys.allm,
      allp: parseHexInt(boolArrayToHex(allowFromPorts)),
      avln: sys.allowFromVlan,
      ivl: sys.independentVlanLookup ? 1 : 0,
      igmp: sys.igmpSnooping ? 1 : 0,
      igmq: sys.igmpQuerier ? 1 : 0,
      igfl: parseHexInt(boolArrayToHex(igmpFastLeave)),
      igve: sys.igmpVersion,
      pdsc: parseHexInt(boolArrayToHex(mndp)),
      lcbl: sys.longPoeCable ? 1 : 0,
    }
  }
}
