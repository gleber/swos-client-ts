import { SwOSClient } from '../swos-client';
import { RawSfpStatus, SfpStatus } from '../../types/sfp';
import { fixJson, hexToString, parseHexInt } from '../../utils/parsers';

export class SfpPage {
  private client: SwOSClient;
  public sfp: SfpStatus | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    const response = await this.client.fetch('/sfp.b');
    const fixed = fixJson(response);
    const raw: RawSfpStatus = JSON.parse(fixed);
    this.sfp = {
      vendor: hexToString(raw.vnd),
      partNumber: hexToString(raw.pn),
      serialNumber: hexToString(raw.sn),
      temperature: parseHexInt(raw.temp),
      txPower: parseHexInt(raw.tx),
      rxPower: parseHexInt(raw.rx),
      voltage: parseHexInt(raw.vcc),
    };
  }
}