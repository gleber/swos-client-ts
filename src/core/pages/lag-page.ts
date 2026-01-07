import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { LagPort, RawLagStatus } from '../../types/lag.js'
import { fixJson, parseHexInt, toLACPMode } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class LagPage implements Page<LagPort[]> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<LagPort[], SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/lacp.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw = JSON.parse(fixed) as RawLagStatus

          const numPorts = raw.mode?.length || 0
          const lagPorts: LagPort[] = []

          for (let i = 0; i < numPorts; i++) {
            lagPorts.push({
              mode: toLACPMode(parseHexInt(raw.mode[i] || '0')),
              group: raw.grp[i] || '0x00',
              backupGroup: raw.sgrp ? raw.sgrp[i] || '0x00' : '0x00',
              partnerMac: raw.mac[i] || '',
            })
          }

          return lagPorts
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `LAG load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<LagPort[]> {
    return Effect.runPromise(this.load())
  }

  save(_data: LagPort[]): Effect.Effect<void, SwOSError> {
    return Effect.void // Read-only
  }

  async saveAsync(data: LagPort[]): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
