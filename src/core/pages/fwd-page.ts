import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { Fwd, RawFwdStatus } from '../../types/fwd.js'
import { fixJson, hexToBoolArray, parseHexInt } from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class FwdPage {
  private client: SwOSClient
  public fwd: Fwd | null = null

  constructor(client: SwOSClient) {
    this.client = client
  }

  async load(): Promise<Either<Fwd, SwOSError>> {
    return (await this.client.fetch('/fwd.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawFwdStatus = JSON.parse(fixed)
        const numPorts = raw.vlan.length
        const fwd: Fwd = {
          mirror: parseHexInt(raw.imr), // imr is 0-indexed port index
          ports: [],
        }

        const enabled = [
          parseHexInt(raw.fp1) !== 0,
          parseHexInt(raw.fp2) !== 0,
          parseHexInt(raw.fp3) !== 0,
          parseHexInt(raw.fp4) !== 0,
          parseHexInt(raw.fp5) !== 0,
          parseHexInt(raw.fp6) !== 0,
        ]
        // Note: RawFwdStatus fields like 'bcst', 'mcst', 'ucst' are not in interface but might exist.
        // Failing back to defaults for now as per old code.
        // Old code mapped: vlan -> defaultVlanId, dvid -> vlanId.
        // This seems swapped naming-wise but preserving behavior.
        const defaultVlanIds = raw.vlan.map((x) => parseHexInt(x))
        const vlanIds = raw.dvid.map((x) => parseHexInt(x))
        const vlanModes = raw.vlni.map((x) => parseHexInt(x))
        const rateLimits = raw.srt.map((x) => parseHexInt(x))
        const lockedVal = parseHexInt(raw.lck) !== 0

        for (let i = 0; i < numPorts; i++) {
          fwd.ports.push({
            enabled: enabled[i] || false,
            linkUp: false, // Not available
            flowControl: false, // Not available
            defaultVlanId: defaultVlanIds[i] || 0,
            vlanId: vlanIds[i] || 0,
            vlanMode: vlanModes[i] || 0,
            locked: lockedVal,
            rateLimit: rateLimits[i] || 0,
            broadcastLimit: 0,
            multicastLimit: 0,
            unicastLimit: 0,
          })
        }
        return Either.result(fwd)
      } catch (e) {
        return Either.error(
          new SwOSError(`FWD load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`)
        )
      }
    })
  }
}
