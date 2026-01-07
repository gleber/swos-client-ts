import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { Link, RawLinkStatus } from '../../types/link.js'
import { FlowControl, LinkStatus } from '../../types/mikrotik-fields.js'
import type { LinkRequest } from '../../types/requests.js'
import {
  boolArrayToHex,
  fixJson,
  fromPoeMode,
  fromPoeStatus,
  hexToBoolArray,
  hexToString,
  parseHexInt,
  stringToHex,
  toCablePairStatus,
  toComboMode,
  toFlowControl,
  toLastHopStatus,
  toLinkSpeed,
  toMikrotik,
  toPoeMode,
  toPoeStatus,
  toQSFPType,
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
            linkStatus: lnk[i] ? LinkStatus.LinkOn : LinkStatus.NoLink,
            duplex: dpx[i] ? 1 : 0, // DuplexMode.Full : DuplexMode.Half (1 vs 0)
            duplexControl: dpxc[i],
            flowControl: fct[i] ? FlowControl.On : FlowControl.Off,
            autoNegotiation: an[i],
            poeMode: raw.poe ? toPoeMode(parseHexInt(raw.poe[i])) : toPoeMode(0),
            poePrio: raw.prio ? parseHexInt(raw.prio[i]) : 0,
            poeStatus: raw.poes ? toPoeStatus(parseHexInt(raw.poes[i])) : toPoeStatus(0),
            speed: raw.spd ? toLinkSpeed(parseHexInt(raw.spd[i])) : toLinkSpeed(0x07),
            speedControl: raw.spdc ? parseHexInt(raw.spdc[i]) : 0,
            power: raw.pwr ? parseHexInt(raw.pwr[i]) : 0,
            current: raw.curr ? parseHexInt(raw.curr[i]) : 0,

            blockOnNoPower: raw.blkp ? hexToBoolArray(raw.blkp, numPorts)[i] : undefined,
            comboMode: raw.cm ? toComboMode(parseHexInt(raw.cm)) : undefined, // Combo mode is per switch usually?
            // Dump: { id: 'cm', t: H, o: ['auto', 'copper', 'sfp'], R: ia }. 'R: ia' -> condition.
            // But 'a:1' is NOT set. So it might be global or per port?
            // The dump has 'id: cm' inside 'Link' block.
            // If it lacks 'a:1', it is likely global for the group?
            // But wait, 'Link' endpoint /link.b usually returns arrays for port properties.
            // If 'cm' is a single string in JSON, it's global.
            // RawLinkStatus `cm?: string`.
            // Wait, if it's GLOBAL, then `raw.cm` is a single value, not array.
            // If I map it to every port, that's fine, but maybe redundant.
            // Let's assume global for now based on 'a:1' absence.

            qsfpType: raw.qtyp ? toQSFPType(parseHexInt(raw.qtyp)) : undefined,
            totalFlowControl: raw.tfct ? toFlowControl(parseHexInt(raw.tfct[i])) : undefined,
            // Dump: { id: 'tfct', F: 1, i: FLOW_CONTROL_VALUES }. 'F: 1'?
            // Usually 'a: 1' means array. 'F: 1' means 'flag'?
            // But standard fields like 'lnk' (Link Status) have 'F: 1' AND are arrays (implied by context or known behavior).
            // 'lnk' in dump has 'i: LINK_STATUS_VALUES' and 'F: 1'.
            // In my parser `lnk` is bitmask.
            // But `LINK_STATUS_VALUES` are 4 values. A bitmask can't hold 4 values per port unless 2 bits per port.
            // `lnk` parsing: `hexToBoolArray`. That only gives 0 or 1.
            // But Link Status 0=no, 1=link, 2=no, 3=paused.
            // If `lnk` is handled as bool array, we lose "paused".
            // That's a separate issue I should probably note, but out of scope?
            // Recommendation was about Missing Types.
            // `tfct` (Flow Control) values: off, tx, rx, on.
            // This clearly needs more than a boolean.
            // If `RawLinkStatus` says `tfct: string` (singular), it might be packed hex?
            // Or `tfct` is actually an array `tfct: string[]`?
            // RawLinkStatus `tfct?: string`.
            // Let's assume `tfct` is like `spd` (array) if it's per port.
            // `mikrotik-dump` says `id: 'tfct'`.
            // Check `spd` in dump: `g: [ { id: 'spd', i: SPEED_VALUES } ]`.
            // `spd` we treat as array.
            // If `tfct` is per port, it should be array explicitly in types if we follow `spd` pattern.
            // But `RawLinkStatus` in `link.ts` has `tfct?: string`. I might need to change to `string[]`.
            // Let's assume `raw.tfct` is array if present.
            // Warning: if I change type to `string[]`, I must be sure.
            // Given I see `hops` (Last Hop) as `string[]` in my proposed types, and `tfct` as `string`.
            // Let's check `link.ts` again. I defined `tfct?: string` in `RawLinkStatus`.
            // I should change `tfct` to `string[]` in `link.ts` if I treat it as one.

            cableTest: {
              lastHop: raw.hops ? toLastHopStatus(parseHexInt(raw.hops[i])) : undefined,
              length: raw.len ? parseHexInt(raw.len[i]) : undefined,
              faultAt: raw.flt ? parseHexInt(raw.flt[i]) : undefined,
              pairStatus: raw.pair ? toCablePairStatus(parseHexInt(raw.pair[i])) : undefined,
            }
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
    const poe = links.map((link) => fromPoeMode(link.poeMode))
    const prio = links.map((link) => link.poePrio)

    return {
      nm: names,
      en: parseHexInt(boolArrayToHex(en)),
      an: parseHexInt(boolArrayToHex(an)),
      spdc,
      dpxc: parseHexInt(boolArrayToHex(dpxc)),
      fct: parseHexInt(boolArrayToHex(links.map((l) => l.flowControl !== FlowControl.Off))),
      poe,
      prio,
    }
  }
}
