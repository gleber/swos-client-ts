import { Effect } from 'effect'
import type { AclRule, RawAclStatus } from '../../types/acl.js'
import { SwOSError } from '../../types/error.js'
import {
  fixJson,
  hexToString,
  parseHexInt,
  toMikrotik,
  toVLANTagMatch,
} from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

export class AclPage implements Page<AclRule[]> {
  constructor(private client: SwOSClient) {}

  load(): Effect.Effect<AclRule[], SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/acl.b'))
      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw = JSON.parse(fixed) as RawAclStatus

          // Determine number of rules based on 'frm' array length
          const count = raw.frm?.length || 0
          const rules: AclRule[] = []

          for (let i = 0; i < count; i++) {
            rules.push({
              enabled: true, // No explict en field in dump? Assuming active if present.
              // Wait, previous `RawAclStatus` didn't have `en`.

              fromPorts: raw.frm?.[i] || '0',
              hits: parseHexInt(raw.pkts?.[i] || '0'),

              macSrc: raw.smac?.[i] || '',
              macSrcMask: raw.smsk?.[i] || '',
              macDst: raw.dmac?.[i] || '',
              macDstMask: raw.dmsk?.[i] || '',
              ethertype: raw.et?.[i] || '',
              vlanTagMatch: toVLANTagMatch(parseHexInt(raw.vtag?.[i] || '0')),
              vlanId: parseHexInt(raw.vlan?.[i] || '0'),
              priority: parseHexInt(raw.prio?.[i] || '0'),

              ipSrc: raw.sip?.[i] || '',
              ipSrcMask: raw.sipm?.[i] || '',
              ipSrcPort: parseHexInt(raw.sprt?.[i] || '0'),
              ipDst: raw.dip?.[i] || '',
              ipDstMask: raw.dipm?.[i] || '',
              ipDstPort: parseHexInt(raw.dprt?.[i] || '0'),
              protocol: parseHexInt(raw.prot?.[i] || '0'),
              dscp: parseHexInt(raw.dscp?.[i] || '0'),

              redirect: parseHexInt(raw.redr?.[i] || '0') !== 0,
              redirectTo: parseHexInt(raw.rdto?.[i] || '0'),
              mirror: parseHexInt(raw.mirr?.[i] || '0') !== 0,
              mirrorTo: 0, // No specific mirror port field in RawAclStatus?
              drop: parseHexInt(raw.drop?.[i] || '0') !== 0,
              rateLimit: parseHexInt(raw.rate?.[i] || '0'),
              setVlanId: parseHexInt(raw.svid?.[i] || '0'),
              setPriority: parseHexInt(raw.spri?.[i] || '0'),
              comment: hexToString(raw.comm?.[i] || ''),
            })
          }

          return rules
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

  async loadAsync(): Promise<AclRule[]> {
    return Effect.runPromise(this.load())
  }

  save(_data: AclRule[]): Effect.Effect<void, SwOSError> {
    return Effect.void // Read-only for now
  }

  async saveAsync(data: AclRule[]): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
