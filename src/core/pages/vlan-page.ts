import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { VlanRequest } from '../../types/requests.js'
import type { RawVlanStatus, Vlan } from '../../types/vlan.js'
import {
  fixJson,
  fromVlanPortMode,
  hexToString,
  parseHexInt,
  toMikrotik,
  toVlanPortMode,
} from '../../utils/parsers.js'
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
            name: r.nm ? hexToString(r.nm) : undefined,
            portIsolation: r.piso ? parseHexInt(r.piso) !== 0 : undefined,
            learning: r.lrn ? parseHexInt(r.lrn) !== 0 : undefined,
            mirror: r.mrr ? parseHexInt(r.mrr) !== 0 : undefined,
            members: r.mbr || '0', // Raw hex string for members bitmask

            independentVlanLookup: parseHexInt(r.ivl) !== 0,
            igmpSnooping: parseHexInt(r.igmp) !== 0,
            portMode: r.prt ? r.prt.map((p) => toVlanPortMode(parseHexInt(p))) : [],
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
      prt: v.portMode.map((p) => fromVlanPortMode(p)),
    }))
  }
}
