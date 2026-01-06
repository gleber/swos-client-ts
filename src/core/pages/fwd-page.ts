import { SwOSClient } from '../swos-client';
import { RawFwdStatus, Fwd } from '../../types/fwd';
import { fixJson, hexToBoolArray, parseHexInt } from '../../utils/parsers';

export class FwdPage {
  private client: SwOSClient;
  public fwd: Fwd | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    const response = await this.client.fetch('/fwd.b');
    const fixed = fixJson(response);
    const raw: RawFwdStatus = JSON.parse(fixed);
    const numPorts = raw.pvid.length;
    this.fwd = {
      enabled: hexToBoolArray(raw.en, numPorts),
      linkUp: hexToBoolArray(raw.lnk, numPorts),
      flowControl: hexToBoolArray(raw.fct, numPorts),
      mirror: parseHexInt(raw.mir),
      defaultVlanId: raw.pvid.map(p => parseHexInt(p)),
      vlanId: raw.vid.map(v => parseHexInt(v)),
      vlanMode: raw.vmde.map(v => parseHexInt(v)),
      locked: raw.lock.map(l => parseHexInt(l) !== 0),
      rateLimit: raw.rate.map(r => parseHexInt(r)),
      broadcastLimit: raw.bcst.map(b => parseHexInt(b)),
      multicastLimit: raw.mcst.map(m => parseHexInt(m)),
      unicastLimit: raw.ucst.map(u => parseHexInt(u)),
    };
  }
}