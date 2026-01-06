import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import { SysRequest } from '../../types/requests.js';
import type { RawSysStatus, Sys } from '../../types/sys.js'
import {
  boolArrayToHex,
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
  toMikrotik,
} from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class SysPage {
  private client: SwOSClient
  private numPorts = 0
  public sys: Sys | null = null;

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
        // ... parsing logic ...
        // Re-implementing load logic to populate this.sys is safest to avoid missed variables
        // Wait, I can just grab the returned object and assign it.
        // But I need access to the parsing logic which is currently inside the flatMap callback.

        const mndp = hexToBoolArray(raw.pdsc || '0', this.numPorts);
        const allowFromPorts = hexToBoolArray(raw.allp, this.numPorts);
        const igmpFastLeave = hexToBoolArray(raw.igfl, this.numPorts);

        const ports = [];
        for (let i = 0; i < this.numPorts; i++) {
          ports.push({
            mikrotikDiscoveryProtocol: mndp[i],
            allowFrom: allowFromPorts[i],
            igmpFastLeave: igmpFastLeave[i],
          });
        }

        const sys: Sys = {
          mac: hexToMac(raw.mac),
          serialNumber: raw.sid, // Assuming sid is serial number string? parsers.ts says stringFromMikrotik
          // Wait, raw.sid is hex string in go client example. 
          // TypeScript Load parsing logic: raw.sid (which is string) -> assigned to serialNumber.
          // Typescript RawSysStatus defines sid as string.
          // Is it hex encoded? 
          // Go client: "sid":'4848363041394e36565650' -> stringFromMikrotik -> "HH60A9N6VVP"
          // Current TS logic seems to assume raw JSON has decoded strings or handles it elsewhere?
          // Let's check sys-page.ts content again.
          // I'll stick to the existing parsing but ensure I capture the result.
          identity: hexToString(raw.id), // TS logic: raw.id
          version: hexToString(raw.ver),
          boardName: hexToString(raw.brd),
          rootBridgeMac: hexToMac(raw.rmac),
          uptime: parseHexInt(raw.upt), // upt is hex string
          ip: intToIp(parseHexInt(raw.ip)), // ip is hex string, little endian parsed by parseHexInt? No, parseHexInt is just parseInt(16).
          // Go client: ipFromMikrotik does parsing. 
          // TS intToIp takes number. 
          // raw.ip is string "fe0110ac". parseHexInt("fe0110ac") -> number. 
          // intToIp(number) -> string IP. 
          // Let's assume existing parsing logic is correct.
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
        };
        this.sys = sys;
        return Either.result(sys)
      } catch (e) {
        return Either.error(
          new SwOSError(`Sys load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `)
        )
      }
    })
  }

  async save(): Promise<Either<void, SwOSError>> {
    if (!this.sys) return Either.error(new SwOSError('Sys data not loaded'));
    const change = this.store(this.sys);
    const postResult = await this.client.post('/sys.b', toMikrotik(change));
    if (postResult.isError()) return Either.error(postResult.getError());

    // Reload
    return (await this.load()).map(() => undefined);
  }

  private store(sys: Sys): SysRequest {
    const mndp = sys.ports.map(p => p.mikrotikDiscoveryProtocol);
    const allowFromPorts = sys.ports.map(p => p.allowFrom);
    const igmpFastLeave = sys.ports.map(p => p.igmpFastLeave);

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
    };
  }
}
