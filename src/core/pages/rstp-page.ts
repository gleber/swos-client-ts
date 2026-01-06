import { SwOSClient } from '../swos-client.js';
import { RawRstpStatus, Rstp } from '../../types/rstp.js';
import { fixJson, parseHexInt, hexToBoolArray } from '../../utils/parsers.js';

export class RstpPage {
  private client: SwOSClient;
  public rstp: Rstp | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    let response = '';
    try {
      response = await this.client.fetch('/rstp.b');
      const fixed = fixJson(response);
      const raw: RawRstpStatus = JSON.parse(fixed);
      const numPorts = raw.role.length;
      this.rstp = {
        enabled: parseHexInt(raw.ena) !== 0,
        role: raw.role.map(r => parseHexInt(r)),
        status: raw.lrn ? hexToBoolArray(raw.lrn, numPorts).map(s => s ? 1 : 0) : [], // assuming lrn is learning status
        priority: [], // not available
        cost: raw.cst.map(c => parseHexInt(c)),
        portId: [], // not available
      };
      // Fill missing arrays
      while (this.rstp.status.length < numPorts) this.rstp.status.push(0);
      while (this.rstp.priority.length < numPorts) this.rstp.priority.push(0);
      while (this.rstp.portId.length < numPorts) this.rstp.portId.push(0);
    } catch (e) {
      throw new Error(`RSTP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`);
    }
  }
}