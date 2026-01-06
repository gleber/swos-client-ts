import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { Link, PoeMode, PoeStatus, RawLinkStatus } from '../../types/link.js'
import { LinkRequest } from '../../types/requests.js';
import {
  fixJson,
  hexToBoolArray,
  hexToString,
  parseHexInt,
  toMikrotik,
  boolArrayToHex,
  stringToHex,
} from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class LinkPage {
  private client: SwOSClient
  public links: Link[] = [];

  constructor(client: SwOSClient) {
    this.client = client
  }

  async load(): Promise<Either<Link[], SwOSError>> {
    return (await this.client.fetch('/link.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawLinkStatus = JSON.parse(fixed)
        const numPorts = raw.nm.length

        // Populate this.links
        const links: Link[] = []
        // ... parsing logic ... 
        const en = hexToBoolArray(raw.en, numPorts)
        const an = hexToBoolArray(raw.an, numPorts)
        const lnk = hexToBoolArray(raw.lnk, numPorts)
        const dpx = hexToBoolArray(raw.dpx, numPorts)
        const dpxc = hexToBoolArray(raw.dpxc, numPorts)
        const fct = hexToBoolArray(raw.fct, numPorts)

        for (let i = 0; i < numPorts; i++) {
          const name = hexToString(raw.nm[i])
          const poeMode = raw.poe ? (parseHexInt(raw.poe[i]) as PoeMode) : 0
          const poePrio = raw.prio ? parseHexInt(raw.prio[i]) : 0
          const poeStatus = raw.poes ? (parseHexInt(raw.poes[i]) as PoeStatus) : 0
          const speedControl = raw.spdc ? parseHexInt(raw.spdc[i]) : 0
          const power = raw.pwr ? parseHexInt(raw.pwr[i]) : 0
          const current = raw.curr ? parseHexInt(raw.curr[i]) : 0

          links.push({
            name,
            enabled: en[i],
            linkUp: lnk[i],
            duplex: dpx[i],
            duplexControl: dpxc[i],
            flowControl: fct[i],
            autoNegotiation: an[i],
            poeMode,
            poePrio,
            poeStatus,
            speedControl,
            power,
            current,
          })
        }
        this.links = links;
        return Either.result(links)
      } catch (e) {
        return Either.error(
          new SwOSError(`Link load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `)
        )
      }
    })
  }

  async save(): Promise<Either<void, SwOSError>> {
    const change = this.store(this.links)
    const postResult = await this.client.post('/link.b', toMikrotik(change))
    if (postResult.isError()) {
      return Either.error(postResult.getError())
    }
    // Reload to confirm/refresh state
    const loadResult = await this.load();
    if (loadResult.isError()) {
      return Either.error(loadResult.getError())
    }
    return Either.result(undefined);
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
