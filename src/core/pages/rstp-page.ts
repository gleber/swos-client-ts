import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawRstpStatus, Rstp } from '../../types/rstp.js';
import { fixJson, parseHexInt, hexToBoolArray } from '../../utils/parsers.js';

export class RstpPage {
  private client: SwOSClient;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<Either<Rstp, SwOSError>> {
    return (await this.client.fetch('/rstp.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawRstpStatus = JSON.parse(fixed);
        const numPorts = raw.role.length;
        const rstp: Rstp = {
          enabled: parseHexInt(raw.ena) !== 0,
          role: raw.role.map(r => parseHexInt(r)),
          status: raw.lrn ? hexToBoolArray(raw.lrn, numPorts).map(s => s ? 1 : 0) : [], // assuming lrn is learning status
          priority: [], // not available
          cost: raw.cst.map(c => parseHexInt(c)),
          portId: [], // not available
        };
        // Fill missing arrays
        while (rstp.status.length < numPorts) rstp.status.push(0);
        while (rstp.priority.length < numPorts) rstp.priority.push(0);
        while (rstp.portId.length < numPorts) rstp.portId.push(0);
        return Either.result(rstp);
      } catch (e) {
        return Either.error(new SwOSError(`RSTP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }
}