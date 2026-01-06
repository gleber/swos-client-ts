import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { VlanRequest } from '../../types/requests.js'
import { type RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan.js'
import { fixJson, parseHexInt, toMikrotik } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'VLAN' tab of SwOS.
 * Endpoint: /vlan.b
 */
export class VlanPage implements Page<Vlan[]> {
  private numPorts = 0

  constructor(private client: SwOSClient) { }

  setNumPorts(numPorts: number) {
    this.numPorts = numPorts
  }

  /**
   * Loads VLAN configuration.
   * Maps SwOS JSON keys:
   * - vid -> id (VLAN ID)
   * - ivl -> independentVlanLookup (bitmask/boolean?)
   * - igmp -> igmpSnooping (boolean)
   * - prt -> portMode (array of enums)
   */
  async load(): Promise<Either<Vlan[], SwOSError>> {
    return (await this.client.fetch('/vlan.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawVlanStatus[] = JSON.parse(fixed)

        const vlans: Vlan[] = raw.map((r) => ({
          id: parseHexInt(r.vid),
          independentVlanLookup: parseHexInt(r.ivl) !== 0,
          igmpSnooping: parseHexInt(r.igmp) !== 0,
          portMode: r.prt.map((p) => parseHexInt(p) as VlanPortMode),
        }))
        return Either.result(vlans)
      } catch (e) {
        return Either.error(
          new SwOSError(
            `Vlan load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `
          )
        )
      }
    })
  }

  async save(vlans: Vlan[]): Promise<Either<void, SwOSError>> {
    const change = this.store(vlans)
    const postResult = await this.client.post('/vlan.b', toMikrotik(change))
    if (postResult.isError()) return Either.error(postResult.getError())
    return (await this.load()).map(() => undefined)
  }

  private store(vlans: Vlan[]): VlanRequest[] {
    return vlans.map((v) => ({
      vid: v.id,
      ivl: v.independentVlanLookup,
      igmp: v.igmpSnooping,
      prt: v.portMode,
    }))
  }

  // Helpers for manipulating Vlan[] data (static or separate helper?) 
  // User requested Page classes to be stateless load/save. 
  // Helper methods that manipulated `this.vlans` are now awkward.
  // I will make them static helpers or remove them if used only internally.
  // They seemed to be utilities for consumers. 
  // I'll make them static or standalone functions? 
  // Or I can keep them but they must operate on passed array?
  // "Make all page classes stateless."
  // I'll leave them out for now to strictly follow "stateless".
  // Consumer works with Vlan[] directly.
}
