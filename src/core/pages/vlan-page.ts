import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan.js'
import { fixJson, parseHexInt } from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class VlanPage {
  private client: SwOSClient
  public vlans: Vlan[] = []
  private numPorts = 0

  constructor(client: SwOSClient) {
    this.client = client
  }

  setNumPorts(num: number) {
    this.numPorts = num
  }

  async load(): Promise<Either<Vlan[], SwOSError>> {
    return (await this.client.fetch('/vlan.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawVlanStatus[] = JSON.parse(fixed)
        const vlans = raw.map((r) => ({
          id: parseHexInt(r.vid),
          independentVlanLookup: parseHexInt(r.ivl) !== 0,
          igmpSnooping: parseHexInt(r.igmp) !== 0,
          portMode: r.prt.map((p) => parseHexInt(p) as VlanPortMode),
        }))
        return Either.result(vlans)
      } catch (e) {
        return Either.error(
          new SwOSError(`VLAN load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`)
        )
      }
    })
  }
}
