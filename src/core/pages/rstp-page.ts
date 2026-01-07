import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { RstpRequest } from '../../types/requests.js'
import type { RawRstpStatus, Rstp, RstpPort } from '../../types/rstp.js'
import {
  fixJson,
  hexToBoolArray,
  parseHexInt,
  toMikrotik,
  toRstpRole,
  toRstpState,
} from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'RSTP' (Rapid Spanning Tree Protocol) tab of SwOS.
 * Endpoint: /rstp.b
 */
export class RstpPage implements Page<Rstp> {
  private numPorts = 0

  constructor(private client: SwOSClient) {}

  /**
   * Loads RSTP configuration and status.
   * Maps SwOS JSON keys:
   * - ena -> enabled (global boolean/bitmask?) - typically global enable on SwOS
   * - role -> role (array of port roles)
   * - lrn -> status (learning status bitmask?)
   * - cst -> path cost
   * - prio -> priority
   * - pid -> port ID
   */
  load(): Effect.Effect<Rstp, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/rstp.b'))

      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw: RawRstpStatus = JSON.parse(fixed)
          self.numPorts = raw.role.length

          const enabled = parseHexInt(raw.ena) !== 0
          const status = raw.lrn
            ? hexToBoolArray(raw.lrn, self.numPorts).map((s) => (s ? 1 : 0))
            : []
          const role = raw.role.map((r) => parseHexInt(r))
          const cost = raw.cst.map((c) => parseHexInt(c))

          const priority = raw.prio ? raw.prio.map((p: string) => parseHexInt(p)) : []
          const portId = raw.pid ? raw.pid.map((p: string) => parseHexInt(p)) : []

          // Note: raw.lrn is separate from role, but user wanted 'status' as RstpState string.
          // In mikrotik-dump.js, lrn is mapped to RSTP_STATE_VALUES.
          // However, here raw.lrn is being treated as a bool array (hexToBoolArray).
          // Checking mikrotik-dump.js again:
          // { n: 'State', id: 'lrn', N: 'fwd', F: 1, i: RSTP_STATE_VALUES }
          // AND existing parser used `hexToBoolArray(raw.lrn)`.
          // If `lrn` is a state enum per port, it should be an array of ints, not a bitmask.
          // BUT previous code: `hexToBoolArray(raw.lrn...` implies it was treated as mask.
          // Wait, `raw.lrn` in `RawRstpStatus` is `string`?
          // In `mikrotik-dump.js`: `Ub('rstp.b'...), {id: 'lrn', i: RSTP_STATE_VALUES}`.
          // This usually implies an array of values if it's per port.
          // BUT raw interface says `lrn: string`.
          // If `lrn` is a string (hex), it might be a packed array or just bits.
          // `mikrotik-dump.js` line 563: `id: 'lrn', N: 'fwd'`.
          // If it has `i: RSTP_STATE_VALUES`, it suggests enumeration.
          // Let's assume `raw.lrn` is actually an array of strings in JSON if `role` is array of strings.
          // `RawRstpStatus`: `lrn: string`. `role: string[]`.
          // This mismatch suggests `lrn` might be different.
          // Users code had `hexToBoolArray(raw.lrn)`.
          // If `lrn` is indeed a single hex string, it can't be an array of enums unless packed.
          // However, RSTP state (discarding/learning/fwd) is 2 bits.
          // Likely `lrn` and `fwd` are bitmasks for compatibility, OR `mikrotik-dump` logic is complex.
          // `mikrotik-dump`: `Y('rstp.b'...)` -> Array of objects?
          // If `rstp.b` returns arrays, then `lrn` should be an array.
          // Check `RawRstpStatus` again. `role: string[]`. `lrn: string`.
          // If `lrn` is array, it should be `string[]`.
          // If existing code worked, `lrn` was a string.
          // But `RstpState` has 3 values. A single bitmask can't represent 3 states per port easily unless it's 2 bits per port.
          // Let's look at `mikrotik-dump` again.
          // `id: 'lrn', N: 'fwd'`.
          // Maybe `lrn` and `fwd` are separate bitmasks?
          // `lrn` = learning? `fwd` = forwarding?
          // If `fwd` bit is set -> Forwarding. If `lrn` bit set -> Learning.
          // If neither -> Discarding.
          // This makes sense for "State".
          // So mapping `lrn` and `fwd` bitmasks to `RstpState`.
          // I need to read `fwd` from `raw` as well.

          const lrnMask = raw.lrn ? parseHexInt(raw.lrn) : 0
          const fwdMask = raw.fwd ? parseHexInt(raw.fwd) : 0

          const ports: RstpPort[] = Array.from({ length: self.numPorts }, (_, i) => {
            const isLrn = (lrnMask & (1 << i)) !== 0
            const isFwd = (fwdMask & (1 << i)) !== 0

            let stateVal = 0 // Discarding
            if (isFwd)
              stateVal = 2 // Forwarding
            else if (isLrn) stateVal = 1 // Learning

            return {
              role: toRstpRole(role[i] || 0),
              status: toRstpState(stateVal),
              priority: priority[i] || 0,
              cost: cost[i] || 0,
              portId: portId[i] || 0,
            }
          })

          return {
            enabled,
            ports,
          }
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `RSTP load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  save(rstp: Rstp): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(rstp)
      yield* _(self.client.post('/rstp.b', toMikrotik(change)))
      yield* _(self.load())
    })
  }

  async loadAsync(): Promise<Rstp> {
    return Effect.runPromise(this.load())
  }

  async saveAsync(rstp: Rstp): Promise<void> {
    return Effect.runPromise(this.save(rstp))
  }

  private store(rstp: Rstp): RstpRequest {
    let ena = 0
    if (rstp.enabled) {
      ena = (1 << this.numPorts) - 1
    }

    return {
      ena,
    }
  }
}
