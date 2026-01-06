import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { VlanRequest } from '../../types/requests.js'
import type { RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan.js'
import { fixJson, parseHexInt, toMikrotik } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'VLAN' tab of SwOS.
 * Endpoint: /vlan.b
 */
export class VlanPage implements Page<Vlan[]> {
  private numPorts = 0

  constructor(private client: SwOSClient) {}

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
  load(): Effect.Effect<Vlan[], SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/vlan.b'))

      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw: RawVlanStatus[] = JSON.parse(fixed)

          return raw.map((r) => ({
            id: parseHexInt(r.vid),
            independentVlanLookup: parseHexInt(r.ivl) !== 0,
            igmpSnooping: parseHexInt(r.igmp) !== 0,
            portMode: r.prt.map((p) => parseHexInt(p) as VlanPortMode),
          }))
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `Vlan load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  save(vlans: Vlan[]): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(vlans)
      yield* _(self.client.post('/vlan.b', toMikrotik(change)))
      yield* _(self.load())
    })
  }

  async loadAsync(): Promise<Vlan[]> {
    return Effect.runPromise(this.load())
  }

  async saveAsync(vlans: Vlan[]): Promise<void> {
    return Effect.runPromise(this.save(vlans))
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
