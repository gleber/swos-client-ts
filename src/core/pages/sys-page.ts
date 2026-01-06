import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { RawSysStatus, Sys } from '../../types/sys.js'
import {
  boolArrayToHex,
  fixJson,
  hexToBoolArray,
  hexToMac,
  hexToString,
  intToIp,
  ipToInt,
  parseHexInt,
  stringToHex,
  toMikrotik,
} from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class SysPage {
  private client: SwOSClient
  private numPorts = 0
  public sys: Sys | null = null

  constructor(client: SwOSClient) {
    this.client = client
  }

  setNumPorts(numPorts: number) {
    this.numPorts = numPorts
  }

  async load(): Promise<Either<Sys, SwOSError>> {
    return (await this.client.fetch('/sys.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawSysStatus = JSON.parse(fixed)

        const mndp = hexToBoolArray(raw.pdsc || '0', this.numPorts)
        const allowFromPorts = hexToBoolArray(raw.allp, this.numPorts)
        const igmpFastLeave = hexToBoolArray(raw.igfl, this.numPorts)

        const ports = []
        for (let i = 0; i < this.numPorts; i++) {
          ports.push({
            mikrotikDiscoveryProtocol: mndp[i],
            allowFrom: allowFromPorts[i],
            igmpFastLeave: igmpFastLeave[i],
          })
        }

        const sys: Sys = {
          mac: hexToMac(raw.mac),
          serialNumber: raw.sid,
          identity: hexToString(raw.id),
          version: hexToString(raw.ver),
          boardName: hexToString(raw.brd),
          rootBridgeMac: hexToMac(raw.rmac),
          uptime: parseHexInt(raw.upt),
          ip: intToIp(parseHexInt(raw.ip)),
          build: parseHexInt(raw.bld),
          dsc: parseHexInt(raw.dsc), // Keeping original raw value if needed, effectively duplicate but type has it
          wdt: parseHexInt(raw.wdt),
          independentVlanLookup: parseHexInt(raw.ivl) !== 0,
          allowFrom: intToIp(parseHexInt(raw.alla)), // alla is allow from address (ip)
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
        return Either.result(sys)
      } catch (e) {
        return Either.error(
          new SwOSError(`Sys load failed: ${(e as Error).message}\nResponse: ${response}`)
        )
      }
    })
  }
}
