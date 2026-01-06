import { SwOSClient } from '../swos-client.js';
import { RawSfpStatus, SfpStatus } from '../../types/sfp.js';
import { fixJson, hexToString, parseHexInt } from '../../utils/parsers.js';

export class SfpPage {
  private client: SwOSClient;
  public sfp: SfpStatus | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    let response = '';
    try {
      response = await this.client.fetch('/sfp.b');
      const fixed = fixJson(response);
      const raw: RawSfpStatus = JSON.parse(fixed);
      this.sfp = {
        vendor: hexToString(raw.vnd),
        partNumber: hexToString(raw.pnr),
        serialNumber: hexToString(raw.ser),
        temperature: parseHexInt(raw.tmp),
        txPower: parseHexInt(raw.tpw),
        rxPower: parseHexInt(raw.rpw),
        voltage: parseHexInt(raw.vcc),
      };
    } catch (e) {
      throw new Error(`SFP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`);
    }
  }
}