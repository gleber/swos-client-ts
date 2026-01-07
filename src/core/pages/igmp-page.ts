import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { RawIgmpStatus } from '../../types/igmp.js'
import { fixJson } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class IgmpPage implements Page<RawIgmpStatus> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<RawIgmpStatus, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/!igmp.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          return JSON.parse(fixed) as RawIgmpStatus
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `IGMP load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<RawIgmpStatus> {
    return Effect.runPromise(this.load())
  }

  save(_data: RawIgmpStatus): Effect.Effect<void, SwOSError> {
    return Effect.void // Read-only for now
  }

  async saveAsync(data: RawIgmpStatus): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
