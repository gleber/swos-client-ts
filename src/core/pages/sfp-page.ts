import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawSfpStatus, SfpStatus } from '../../types/sfp.js';
import { fixJson, hexToString, parseHexInt } from '../../utils/parsers.js';

export class SfpPage {
  private client: SwOSClient;
  public sfp: SfpStatus | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<Either<void, SwOSError>> {
    return (await this.client.fetch('/sfp.b')).flatMap(response => {
      try {
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
        return Either.result(undefined);
      } catch (e) {
        return Either.error(new SwOSError(`SFP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }
}