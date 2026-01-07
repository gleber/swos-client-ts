import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { PortStats, RawStatsStatus } from '../../types/stat.js'
import { fixJson, parseHexInt } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class StatsPage implements Page<PortStats[]> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<PortStats[], SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/!stats.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw = JSON.parse(fixed) as RawStatsStatus

          // Assuming all arrays are same length, based on number of ports
          // picking 'nm' or just one of the arrays to determine length?
          // RawStatsStatus doesn't have 'nm'. 'rrb' seems safe.
          const numPorts = raw.rrb?.length || 0

          const combine = (
            lowArr: string[] | undefined,
            highArr: string[] | undefined,
            idx: number
          ): number => {
            const low = lowArr?.[idx] ? parseHexInt(lowArr[idx]) : 0
            const high = highArr?.[idx] ? parseHexInt(highArr[idx]) : 0
            // SwOS 64-bit counters: high word * 2^32 + low word
            // Javascript number is double, can hold integer up to 2^53 safely.
            return high * 0x100000000 + low
          }

          const val = (arr: string[] | undefined, idx: number): number => {
            return arr?.[idx] ? parseHexInt(arr[idx]) : 0
          }

          const stats: PortStats[] = []
          for (let i = 0; i < numPorts; i++) {
            stats.push({
              rxRate: val(raw.rrb, i),
              txRate: val(raw.trb, i),
              rxPacketRate: val(raw.rrp, i),
              txPacketRate: val(raw.trp, i),
              rxBytes: combine(raw.rb, raw.rbh, i),
              txBytes: combine(raw.tb, raw.tbh, i),
              rxTotalPackets: val(raw.rtp, i),
              txTotalPackets: val(raw.ttp, i),
              rxUnicastPackets: combine(raw.rup, raw.ruph, i),
              txUnicastPackets: combine(raw.tup, raw.tuph, i),
              rxBroadcastPackets: combine(raw.rbp, raw.rbph, i),
              txBroadcastPackets: combine(raw.tbp, raw.tbph, i),
              rxMulticastPackets: combine(raw.rmp, raw.rmph, i),
              txMulticastPackets: combine(raw.tmp, raw.tmph, i),
              rxPauses: val(raw.rpp, i),
              rxMacErrors: val(raw.rte, i),
              rxFcsErrors: val(raw.rfcs, i),
              rxJabber: val(raw.rae, i),
              rxRunts: val(raw.rr, i),
              rxFragments: val(raw.fr, i),
              rxOverruns: val(raw.rov, i),
              txPauses: val(raw.tpp, i),
              txUnderruns: val(raw.tur, i),
              txCollisions: val(raw.tcl, i),
              txMultipleCollisions: val(raw.tmc, i),
              txExcessiveCollisions: val(raw.tec, i),
              txLateCollisions: val(raw.tlc, i),
              txDeferred: val(raw.tdf, i),
            })
          }

          return stats
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `Stats load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<PortStats[]> {
    return Effect.runPromise(this.load())
  }

  save(_data: PortStats[]): Effect.Effect<void, SwOSError> {
    return Effect.void // Stats are read-only
  }

  async saveAsync(data: PortStats[]): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
