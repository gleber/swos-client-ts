import { Effect } from 'effect'
import type { RawAclStatus } from '../../types/acl.js'
import { SwOSError } from '../../types/error.js'
import { fixJson } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class AclPage implements Page<RawAclStatus> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<RawAclStatus, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/acl.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          return JSON.parse(fixed) as RawAclStatus
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `ACL load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<RawAclStatus> {
    return Effect.runPromise(this.load())
  }

  save(_data: RawAclStatus): Effect.Effect<void, SwOSError> {
    return Effect.void // Read-only for now
  }

  async saveAsync(data: RawAclStatus): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
