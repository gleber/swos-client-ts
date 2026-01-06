import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawSysStatus, Sys } from '../../types/sys.js';
import { fixJson, hexToBoolArray, hexToString, parseHexInt, hexToMac, intToIp, toMikrotik, stringToHex, ipToInt, boolArrayToHex } from '../../utils/parsers.js';

export class SysPage {
  private client: SwOSClient;
  private numPorts: number = 0;
  public sys: Sys | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  setNumPorts(numPorts: number) {
    this.numPorts = numPorts;
  }

  async load(): Promise<Either<void, SwOSError>> {
    return (await this.client.fetch('/sys.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawSysStatus = JSON.parse(fixed);

        this.sys = {
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
          mikrotikDiscoveryProtocol: hexToBoolArray(raw.pdsc || '0', this.numPorts),
          independentVlanLookup: parseHexInt(raw.ivl) !== 0,
          allowFrom: intToIp(parseHexInt(raw.alla)),
          allm: parseHexInt(raw.allm),
          allowFromPorts: hexToBoolArray(raw.allp, this.numPorts),
          allowFromVlan: parseHexInt(raw.avln),
          igmpSnooping: parseHexInt(raw.igmp) !== 0,
          igmpQuerier: parseHexInt(raw.igmq || '0') !== 0,
          longPoeCable: parseHexInt(raw.lcbl) !== 0,
          igmpFastLeave: hexToBoolArray(raw.igfl, this.numPorts),
          igmpVersion: parseHexInt(raw.igve || '0'),
          voltage: parseHexInt(raw.volt),
          temperature: parseHexInt(raw.temp),
          bridgePriority: parseHexInt(raw.prio),
          portCostMode: parseHexInt(raw.cost),
          forwardReservedMulticast: parseHexInt(raw.frmc || '0') !== 0,
          addressAcquisition: parseHexInt(raw.iptp),
          staticIpAddress: intToIp(parseHexInt(raw.sip)),
        };
        return Either.result(undefined);
      } catch (e) {
        return Either.error(new SwOSError(`Sys load failed: ${(e as Error).message}\nResponse: ${response}`));
      }
    });
  }
}
