import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { RstpRequest } from '../../types/requests.js'
import type { RawRstpStatus, Rstp, RstpPort } from '../../types/rstp.js'
import { fixJson, parseHexInt, toMikrotik, toRstpRole, toRstpState } from '../../utils/parsers.js'
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
          const role = raw.role.map((r) => parseHexInt(r))
          const cost = raw.cst.map((c) => parseHexInt(c))

          const priority = raw.prio ? raw.prio.map((p: string) => parseHexInt(p)) : []
          const portId = raw.pid ? raw.pid.map((p: string) => parseHexInt(p)) : []

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
