import { SwOSClient } from '../swos-client';
import { RawRstpStatus, Rstp } from '../../types/rstp';
import { fixJson, parseHexInt } from '../../utils/parsers';

export class RstpPage {
  private client: SwOSClient;
  public rstp: Rstp | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    const response = await this.client.fetch('/rstp.b');
    const fixed = fixJson(response);
    const raw: RawRstpStatus = JSON.parse(fixed);
    this.rstp = {
      enabled: parseHexInt(raw.en) !== 0,
      role: raw.role.map(r => parseHexInt(r)),
      status: raw.sta.map(s => parseHexInt(s)),
      priority: raw.prio.map(p => parseHexInt(p)),
      cost: raw.cost.map(c => parseHexInt(c)),
      portId: raw.port.map(p => parseHexInt(p)),
    };
  }
}