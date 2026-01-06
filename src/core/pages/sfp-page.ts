import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawSfpStatus, SfpStatus } from '../../types/sfp.js';
import { fixJson, hexToString, parseHexInt } from '../../utils/parsers.js';

export class SfpPage {
  private client: SwOSClient;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<Either<SfpStatus[], SwOSError>> {
    return (await this.client.fetch('/sfp.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawSfpStatus = JSON.parse(fixed);

        const sfps: SfpStatus[] = [];
        if (Array.isArray(raw.vnd)) {
          // Array response
          const count = raw.vnd.length;
          const vendors = raw.vnd as string[];
          const partNumbers = raw.pnr as string[];
          const serialNumbers = raw.ser as string[];
          const temperatures = raw.tmp as string[];
          const txPowers = raw.tpw as string[];
          const rxPowers = raw.rpw as string[];
          const voltages = raw.vcc as string[];

          for (let i = 0; i < count; i++) {
            sfps.push({
              vendor: hexToString(vendors[i]),
              partNumber: hexToString(partNumbers[i]),
              serialNumber: hexToString(serialNumbers[i]),
              temperature: parseHexInt(temperatures[i]),
              txPower: parseHexInt(txPowers[i]),
              rxPower: parseHexInt(rxPowers[i]),
              voltage: parseHexInt(voltages[i]),
            });
          }
        } else {
          // Single response
          sfps.push({
            vendor: hexToString(raw.vnd as string),
            partNumber: hexToString(raw.pnr as string),
            serialNumber: hexToString(raw.ser as string),
            temperature: parseHexInt(raw.tmp as string),
            txPower: parseHexInt(raw.tpw as string),
            rxPower: parseHexInt(raw.rpw as string),
            voltage: parseHexInt(raw.vcc as string),
          });
        }

        return Either.result(sfps);
      } catch (e) {
        return Either.error(new SwOSError(`SFP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }
}