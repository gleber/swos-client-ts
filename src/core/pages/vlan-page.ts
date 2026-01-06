import { SwOSClient } from '../swos-client';
import { RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan';
import { fixJson, parseHexInt } from '../../utils/parsers';

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
    const response = await this.client.fetch('/vlan.b');
    const fixed = fixJson(response);
    const raw: RawVlanStatus[] = JSON.parse(fixed);
    this.vlans = raw.map(r => ({
      id: parseHexInt(r.vid),
      independentVlanLookup: parseHexInt(r.ivl) !== 0,
      igmpSnooping: parseHexInt(r.igmp) !== 0,
      portMode: r.prt.map(p => parseHexInt(p) as VlanPortMode),
    }));
  }
}