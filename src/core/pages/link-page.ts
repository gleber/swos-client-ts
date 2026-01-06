import { Either } from '../../types/either.js'
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
  constructor(private client: SwOSClient) { }

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
  async load(): Promise<Either<Link[], SwOSError>> {
    return (await this.client.fetch('/link.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawLinkStatus = JSON.parse(fixed)
        const numPorts = raw.nm.length

        const en = hexToBoolArray(raw.en, numPorts)
        const an = hexToBoolArray(raw.an, numPorts)
        const lnk = hexToBoolArray(raw.lnk, numPorts)
        const dpx = hexToBoolArray(raw.dpx, numPorts)
        const dpxc = hexToBoolArray(raw.dpxc, numPorts)
        const fct = hexToBoolArray(raw.fct, numPorts)

        const links: Link[] = Array.from({ length: numPorts }, (_, i) => ({
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

        return Either.result(links)
      } catch (e) {
        return Either.error(
          new SwOSError(
            `Link load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `
          )
        )
      }
    })
  }

  async save(links: Link[]): Promise<Either<void, SwOSError>> {
    const change = this.store(links)
    const postResult = await this.client.post('/link.b', toMikrotik(change))
    if (postResult.isError()) {
      return Either.error(postResult.getError())
    }
    // Reload to confirm/refresh state
    const loadResult = await this.load()
    if (loadResult.isError()) {
      return Either.error(loadResult.getError())
    }
    return Either.result(undefined)
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
