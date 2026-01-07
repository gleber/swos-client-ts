import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { SnmpRequest } from '../../types/requests.js'
import type { RawSnmpStatus, Snmp } from '../../types/snmp.js'
import { fixJson, hexToString, parseHexInt, stringToHex, toMikrotik } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class SnmpPage implements Page<Snmp> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<Snmp, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/snmp.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw = JSON.parse(fixed) as RawSnmpStatus

          return {
            enabled: parseHexInt(raw.en) === 1,
            community: hexToString(raw.com || ''),
            contactInfo: hexToString(raw.ci || ''),
            location: hexToString(raw.loc || ''),
          }
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `SNMP load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  async loadAsync(): Promise<Snmp> {
    return Effect.runPromise(this.load())
  }

  save(snmp: Snmp): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(snmp)
      yield* _(self.client.post('/snmp.b', toMikrotik(change)))
      yield* _(self.load()) // Reload to confirm
    })
  }

  async saveAsync(data: Snmp): Promise<void> {
    return Effect.runPromise(this.save(data))
  }

  private store(snmp: Snmp): SnmpRequest {
    return {
      en: snmp.enabled ? 1 : 0,
      com: stringToHex(snmp.community),
      ci: stringToHex(snmp.contactInfo),
      loc: stringToHex(snmp.location),
    }
  }
}
