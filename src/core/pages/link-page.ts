import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { Link, PoeMode, PoeStatus, RawLinkStatus } from '../../types/link.js'
import type { LinkRequest } from '../../types/requests.js'
import {
  boolArrayToHex,
  fixJson,
  hexToBoolArray,
  hexToString,
  parseHexInt,
  stringToHex,
  toMikrotik,
} from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'Link' tab of SwOS.
 * Endpoint: /link.b
 */
export class LinkPage implements Page<Link[]> {
  constructor(private client: SwOSClient) {}

  /**
   * Loads link configuration and status.
   * Maps SwOS JSON keys:
   * - nm -> name (hex encoded)
   * - en -> enabled (bitmask)
   * - lnk -> linkUp (bitmask)
   * - an -> autoNegotiation (bitmask)
   * - dpx -> duplex (bitmask)
   * - spdc -> speedControl (array)
   */
  load(): Effect.Effect<Link[], SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/link.b'))

      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw: RawLinkStatus = JSON.parse(fixed)
          const numPorts = raw.nm.length

          const en = hexToBoolArray(raw.en, numPorts)
          const an = hexToBoolArray(raw.an, numPorts)
          const lnk = hexToBoolArray(raw.lnk, numPorts)
          const dpx = hexToBoolArray(raw.dpx, numPorts)
          const dpxc = hexToBoolArray(raw.dpxc, numPorts)
          const fct = hexToBoolArray(raw.fct, numPorts)

          return Array.from({ length: numPorts }, (_, i) => ({
            name: hexToString(raw.nm[i]),
            enabled: en[i],
            linkUp: lnk[i],
            duplex: dpx[i],
            duplexControl: dpxc[i],
            flowControl: fct[i],
            autoNegotiation: an[i],
            poeMode: raw.poe ? (parseHexInt(raw.poe[i]) as PoeMode) : 0,
            poePrio: raw.prio ? parseHexInt(raw.prio[i]) : 0,
            poeStatus: raw.poes ? (parseHexInt(raw.poes[i]) as PoeStatus) : 0,
            speedControl: raw.spdc ? parseHexInt(raw.spdc[i]) : 0,
            power: raw.pwr ? parseHexInt(raw.pwr[i]) : 0,
            current: raw.curr ? parseHexInt(raw.curr[i]) : 0,
          }))
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `Link load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  save(links: Link[]): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(links)
      yield* _(self.client.post('/link.b', toMikrotik(change)))
      yield* _(self.load())
    })
  }

  async loadAsync(): Promise<Link[]> {
    return Effect.runPromise(this.load())
  }

  async saveAsync(links: Link[]): Promise<void> {
    return Effect.runPromise(this.save(links))
  }

  private store(links: Link[]): LinkRequest {
    const names = links.map((link) => stringToHex(link.name))
    const en = links.map((link) => link.enabled)
    const an = links.map((link) => link.autoNegotiation)
    const spdc = links.map((link) => link.speedControl)
    const dpxc = links.map((link) => link.duplexControl)
    const fct = links.map((link) => link.flowControl)
    const poe = links.map((link) => link.poeMode)
    const prio = links.map((link) => link.poePrio)

    return {
      nm: names,
      en: parseHexInt(boolArrayToHex(en)),
      an: parseHexInt(boolArrayToHex(an)),
      spdc,
      dpxc: parseHexInt(boolArrayToHex(dpxc)),
      fct: parseHexInt(boolArrayToHex(fct)),
      poe,
      prio,
    }
  }
}
