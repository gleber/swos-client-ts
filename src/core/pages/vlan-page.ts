import { SwOSClient } from '../swos-client.js';
import { RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan.js';
import { fixJson, parseHexInt } from '../../utils/parsers.js';

export class VlanPage {
  private client: SwOSClient;
  public vlans: Vlan[] = [];
  private numPorts: number = 0;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  setNumPorts(num: number) {
    this.numPorts = num;
  }

  async load(): Promise<void> {
    let response = '';
    try {
      response = await this.client.fetch('/vlan.b');
      const fixed = fixJson(response);
      const raw: RawVlanStatus[] = JSON.parse(fixed);
      this.vlans = raw.map(r => ({
        id: parseHexInt(r.vid),
        independentVlanLookup: parseHexInt(r.ivl) !== 0,
        igmpSnooping: parseHexInt(r.igmp) !== 0,
        portMode: r.prt.map(p => parseHexInt(p) as VlanPortMode),
      }));
    } catch (e) {
      throw new Error(`VLAN load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`);
    }
  }
}