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

  async load(): Promise<Either<void, SwOSError>> {
    return (await this.client.fetch('/fwd.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawFwdStatus = JSON.parse(fixed);
        const numPorts = raw.vlan.length;
        this.fwd = {
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
        while (this.fwd.linkUp.length < numPorts) this.fwd.linkUp.push(false);
        while (this.fwd.flowControl.length < numPorts) this.fwd.flowControl.push(false);
        while (this.fwd.locked.length < numPorts) this.fwd.locked.push(this.fwd.locked[0] || false);
        while (this.fwd.broadcastLimit.length < numPorts) this.fwd.broadcastLimit.push(0);
        while (this.fwd.multicastLimit.length < numPorts) this.fwd.multicastLimit.push(0);
        while (this.fwd.unicastLimit.length < numPorts) this.fwd.unicastLimit.push(0);
        return Either.result(undefined);
      } catch (e) {
        return Either.error(new SwOSError(`FWD load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }
}