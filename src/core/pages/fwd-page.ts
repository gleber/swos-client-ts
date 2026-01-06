import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawFwdStatus, Fwd } from '../../types/fwd.js';
import { fixJson, hexToBoolArray, parseHexInt } from '../../utils/parsers.js';

export class FwdPage {
  private client: SwOSClient;
  public fwd: Fwd | null = null;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<Either<Fwd, SwOSError>> {
    return (await this.client.fetch('/fwd.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawFwdStatus = JSON.parse(fixed);
        const numPorts = raw.vlan.length;
        const fwd: Fwd = {
          enabled: [parseHexInt(raw.fp1) !== 0, parseHexInt(raw.fp2) !== 0, parseHexInt(raw.fp3) !== 0, parseHexInt(raw.fp4) !== 0, parseHexInt(raw.fp5) !== 0, parseHexInt(raw.fp6) !== 0], // assuming fp are enables
          linkUp: [], // not available
          flowControl: [], // not available
          mirror: parseHexInt(raw.imr),
          defaultVlanId: raw.vlan.map(v => parseHexInt(v)),
          vlanId: raw.dvid.map(d => parseHexInt(d)),
          vlanMode: raw.vlni.map(v => parseHexInt(v)), // assuming vlni is mode
          locked: [parseHexInt(raw.lck) !== 0], // single, perhaps repeat
          rateLimit: raw.srt.map(s => parseHexInt(s)),
          broadcastLimit: [], // not available
          multicastLimit: [], // not available
          unicastLimit: [], // not available
        };
        // Fill arrays to numPorts
        while (fwd.linkUp.length < numPorts) fwd.linkUp.push(false);
        while (fwd.flowControl.length < numPorts) fwd.flowControl.push(false);
        while (fwd.locked.length < numPorts) fwd.locked.push(fwd.locked[0] || false);
        while (fwd.broadcastLimit.length < numPorts) fwd.broadcastLimit.push(0);
        while (fwd.multicastLimit.length < numPorts) fwd.multicastLimit.push(0);
        while (fwd.unicastLimit.length < numPorts) fwd.unicastLimit.push(0);
        return Either.result(fwd);
      } catch (e) {
        return Either.error(new SwOSError(`FWD load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }
}