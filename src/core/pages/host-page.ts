import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { RawHostStatus } from '../../types/host.js'
import { fixJson } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class HostPage implements Page<RawHostStatus> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<RawHostStatus, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/host.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          return JSON.parse(fixed) as RawHostStatus
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `Host load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<RawHostStatus> {
    return Effect.runPromise(this.load())
  }

  save(_data: RawHostStatus): Effect.Effect<void, SwOSError> {
    return Effect.void // Read-only for now
  }

  async saveAsync(data: RawHostStatus): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
